import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, NativeModules } from 'react-native';

const LAN_IP = '192.168.0.33';

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

  // Fallbacks: On physical devices with adb reverse, 'localhost' routes over USB.
  return 'localhost';
};

let activeHost = resolveHost();

export const PRODUCTION_BACKEND_URL = 'https://naveen-chitfund-production.up.railway.app';

export const getBaseUrl = (): string => {
  if (!__DEV__) {
    return `${PRODUCTION_BACKEND_URL}/api/v1`;
  }
  return `http://${activeHost}:4000/api/v1`;
};

const BASE_URL = getBaseUrl();

const candidateHosts = [
  resolveHost(),
  'localhost',
  LAN_IP,
  '10.0.2.2',
].filter((h, i, arr) => h && arr.indexOf(h) === i);

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
        if (__DEV__) {
          for (const host of candidateHosts) {
            if (host === activeHost) continue;
            try {
              const fallbackBaseUrl = `http://${host}:4000/api/v1`;
              config.baseURL = fallbackBaseUrl;
              const res = await axios(config);
              activeHost = host;
              apiClient.defaults.baseURL = fallbackBaseUrl;
              connectivityListeners.forEach((cb) => cb(true));
              return res;
            } catch {
              // try next candidate host
            }
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

