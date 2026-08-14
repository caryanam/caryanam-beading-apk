import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';

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
      const response = await apiClient.post('/api/auth/login', {
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
      const response = await apiClient.post('/api/dealer/register', {
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
      const response = await apiClient.post('/api/inspector/register', {
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
      const response = await apiClient.post('/api/auth/send-otp', { email, mobile });
      return response.data?.success ?? true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      throw new Error(msg);
    }
  },

  // Send password reset OTP
  async sendPasswordOtp(email: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/auth/send-password-otp', { email });
      return response.data?.success ?? true;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      throw new Error(msg);
    }
  },

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/auth/verify-otp', { email, otp });
      return response.data?.success ?? false;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP.';
      throw new Error(msg);
    }
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
