import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, NativeModules } from 'react-native';

const CURRENT_LAN_IP = '192.168.0.46';

export const resolveHost = (): string => {
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {}

  // Fallbacks: If running on physical Android over USB or adb reverse
  if (Platform.OS === 'android') {
    return '127.0.0.1';
  }
  return 'localhost';
};

export const PRODUCTION_BACKEND_URL = 'https://naveen-chitfund-production.up.railway.app';

export let activeHost = resolveHost();
export let activeBaseUrl: string = '';

// Candidate base URLs in priority order for both USB-connected testing & cloud release
export const candidateBaseUrls = [
  // 1. Cloud Production URL
  `${PRODUCTION_BACKEND_URL}/api/v1`,
  // 2. USB reverse loopback (Android physical device over USB cable with adb reverse)
  'http://127.0.0.1:4000/api/v1',
  // 3. Localhost (iOS Simulator / Desktop / Web)
  'http://localhost:4000/api/v1',
  // 4. Current host machine Wi-Fi LAN IP
  `http://${CURRENT_LAN_IP}:4000/api/v1`,
  // 5. Android Emulator loopback
  'http://10.0.2.2:4000/api/v1',
  // 6. Metro resolved host if different
  `http://${resolveHost()}:4000/api/v1`,
].filter((url, idx, arr) => url && arr.indexOf(url) === idx);

export const getBaseUrl = (): string => {
  if (activeBaseUrl) return activeBaseUrl;
  if (!__DEV__) {
    activeBaseUrl = `${PRODUCTION_BACKEND_URL}/api/v1`;
    return activeBaseUrl;
  }
  // In development, default to USB adb reverse / local server first
  activeBaseUrl = `http://${activeHost}:4000/api/v1`;
  return activeBaseUrl;
};

const BASE_URL = getBaseUrl();

const TOKEN_KEY = 'chittech_jwt_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = async (token: string | null) => {
  if (token) {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } else {
    return localStorage.getItem(TOKEN_KEY);
  }
};

type ConnectivityListener = (isOnline: boolean) => void;
type UnauthorizedListener = () => void;

let connectivityListeners: ConnectivityListener[] = [];
let unauthorizedListeners: UnauthorizedListener[] = [];

export const onConnectivityChange = (cb: ConnectivityListener) => {
  connectivityListeners.push(cb);
  return () => {
    connectivityListeners = connectivityListeners.filter((l) => l !== cb);
  };
};

export const onUnauthorized = (cb: UnauthorizedListener) => {
  unauthorizedListeners.push(cb);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== cb);
  };
};

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    if (!config.headers['Authorization']) {
      const token = await getStoredToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Error Normalization, Candidate Host Failover, 401 Expiry & Connectivity Tracking
apiClient.interceptors.response.use(
  (response) => {
    connectivityListeners.forEach((cb) => cb(true));
    return response;
  },
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED' ||
      (error.message && error.message.includes('Network'));

    if (isNetworkError) {
      const config = error.config as any;
      if (config && !config._isRetryCandidate) {
        config._isRetryCandidate = true;
        for (const candidateUrl of candidateBaseUrls) {
          if (candidateUrl === (activeBaseUrl || BASE_URL)) continue;
          try {
            const endpoint = (config.url || '').replace(/^https?:\/\/[^/]+(\/api\/v1)?/, '');
            const targetUrl = `${candidateUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
            const res = await axios({
              ...config,
              url: targetUrl,
              baseURL: undefined,
              timeout: 8000,
            });
            activeBaseUrl = candidateUrl;
            apiClient.defaults.baseURL = candidateUrl;
            connectivityListeners.forEach((cb) => cb(true));
            return res;
          } catch {
            // try next candidate base URL
          }
        }
      }
      connectivityListeners.forEach((cb) => cb(false));
    } else if (error.response?.status === 401) {
      await setAuthToken(null);
      unauthorizedListeners.forEach((cb) => cb());
    }

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

