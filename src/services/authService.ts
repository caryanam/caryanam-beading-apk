import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, API_BASE_URL } from '../config/api';
import axios from 'axios';

// Public HTTP client without JWT Bearer token auto-injection
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface UserSession {
  id?: number;
  name: string;
  email: string;
  role: 'admin' | 'dealer' | 'inspector';
  dealershipName?: string;
  mobileNumber?: string;
  token: string;
}

export const authService = {
  // Login user (Dealer / Inspector / Admin)
  async login(email: string, password: string): Promise<UserSession> {
    try {
      const response = await publicClient.post('/api/auth/login', {
        email,
        password,
      });

      const resData = response.data;
      if (resData.success && resData.data) {
        const authData = resData.data;
        const session: UserSession = {
          id: authData.id,
          name: authData.fullName || authData.dealershipName || email.split('@')[0],
          email: authData.email || email,
          role: (authData.role || 'DEALER').toLowerCase() as any,
          dealershipName: authData.dealershipName || authData.fullName,
          mobileNumber: authData.mobileNumber,
          token: authData.token,
        };

        await AsyncStorage.setItem('user_session', JSON.stringify(session));
        return session;
      } else {
        throw new Error(resData.message || 'Invalid email or password');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check credentials and connection.';
      throw new Error(msg);
    }
  },

  // Register new Dealer
  async registerDealer(data: {
    dealershipName: string;
    ownerName: string;
    email: string;
    mobile: string;
    password: string;
    address?: string;
    area?: string;
    city?: string;
  }) {
    try {
      const response = await publicClient.post('/api/dealer/register', {
        ...data,
        confirmPassword: data.password,
      });

      const resData = response.data;
      if (resData.success) {
        return resData.message || 'Dealer registered successfully!';
      } else {
        throw new Error(resData.message || 'Registration failed.');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Dealer registration failed.';
      throw new Error(msg);
    }
  },

  // Register new Inspector
  async registerInspector(data: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
  }) {
    try {
      const response = await publicClient.post('/api/inspector/register', {
        ...data,
        confirmPassword: data.password,
      });

      const resData = response.data;
      if (resData.success) {
        return resData.message || 'Inspector registered successfully!';
      } else {
        throw new Error(resData.message || 'Registration failed.');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Inspector registration failed.';
      throw new Error(msg);
    }
  },

  // Send OTP
  async sendOtp(email: string, mobile?: string): Promise<boolean> {
    try {
      const response = await publicClient.post('/api/auth/send-otp', { email, mobile });
      return response.data?.success ?? true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      throw new Error(msg);
    }
  },

  // Send password reset OTP
  async sendPasswordOtp(email: string): Promise<boolean> {
    try {
      const response = await publicClient.post('/api/auth/send-password-otp', { email });
      return response.data?.success ?? true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      throw new Error(msg);
    }
  },

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    try {
      const response = await publicClient.post('/api/auth/verify-otp', { email, otp });
      return response.data?.success ?? false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP.';
      throw new Error(msg);
    }
  },

  // Reset password with OTP
  async resetPassword(email: string, otp: string, newPassword: string): Promise<boolean> {
    const payload = {
      email,
      otp,
      newPassword,
      password: newPassword,
      confirmPassword: newPassword,
    };

    const endpoints = [
      { method: 'post', url: '/api/auth/reset-password' },
      { method: 'put', url: '/api/auth/reset-password' },
      { method: 'post', url: '/api/auth/update-password' },
      { method: 'put', url: '/api/auth/update-password' },
      { method: 'post', url: '/api/auth/change-password' },
      { method: 'put', url: '/api/auth/change-password' },
      { method: 'post', url: '/api/auth/forgot-password' },
      { method: 'put', url: '/api/auth/forgot-password' },
    ];

    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const res = ep.method === 'put'
          ? await publicClient.put(ep.url, payload)
          : await publicClient.post(ep.url, payload);
        
        if (res.data?.success !== false) {
          return true;
        }
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        const msg = String(err.response?.data?.message || err.response?.data || '');
        // If 404 or Spring Boot static resource error, try next candidate endpoint
        if (status === 404 || msg.includes('No static resource') || msg.includes('Not Found')) {
          continue;
        }
        // If real API error (e.g. 400 invalid OTP), throw original error message
        const realMsg = err.response?.data?.message || err.message || 'Password reset failed.';
        throw new Error(realMsg);
      }
    }

    const finalMsg =
      lastError?.response?.data?.message ||
      lastError?.message ||
      'Password reset failed. Please check backend endpoint.';
    throw new Error(finalMsg);
  },

  // Read active stored session
  async getStoredSession(): Promise<UserSession | null> {
    try {
      const data = await AsyncStorage.getItem('user_session');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('user_session');
  },
};
