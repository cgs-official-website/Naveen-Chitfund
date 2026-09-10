import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Localhost URL for Android emulator is 10.0.2.2; for iOS simulator or web is localhost
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

const TOKEN_KEY = 'chittech_jwt_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

// Response Interceptor for Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);
