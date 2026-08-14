import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const DEFAULT_URL = 'https://api.caryanamlive.com/';

export const API_BASE_URL = DEFAULT_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Auto-inject JWT Bearer Token into outgoing requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const sessionData = await AsyncStorage.getItem('user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session?.token && config.headers) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch (e) {
      console.error('Failed to attach JWT token to request', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Detect expired/invalid sessions (HTTP 401) and notify the app to show a login prompt
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && error?.config?.headers?.Authorization) {
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        const role = sessionData ? (JSON.parse(sessionData)?.role || 'dealer') : 'dealer';
        DeviceEventEmitter.emit('session-expired', { role });
      } catch (e) {
        DeviceEventEmitter.emit('session-expired', { role: 'dealer' });
      }
    }
    return Promise.reject(error);
  }
);
