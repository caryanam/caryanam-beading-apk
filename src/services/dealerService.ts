import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient, API_BASE_URL } from '../config/api';
import axios from 'axios';

export const dealerService = {
  // Get live auctions in marketplace
  async getMarketplace() {
    const res = await apiClient.get('/api/dealer/inspections');
    return res.data;
  },

  // Get freelancer vehicles
  async getFreelancerVehicles() {
    const res = await apiClient.get('/api/freelancer/inspection');
    return res.data;
  },

  // Get dealer watchlist (wishlist)
  async getWishlist() {
    const res = await apiClient.get('/api/dealer/wishlist');
    return res.data;
  },

  // Get dealer bids history
  async getBidsHistory() {
    const res = await apiClient.get('/api/dealer/bids');
    return res.data;
  },

  // Get dealer profile details (like won auctions count)
  async getProfile() {
    const res = await apiClient.get('/api/dealer/profile');
    return res.data;
  },

  // Get realtime bid increments/history for a vehicle
  async getVehicleBidHistory(vehicleId: number) {
    const res = await apiClient.get(`/api/dealer/inspection/${vehicleId}/bids`);
    return res.data;
  },

  // Get full marketplace inspection details (raw inspection + bid history)
  async getMarketplaceInspectionDetails(id: number) {
    const res = await apiClient.get(`/api/dealer/inspection/${id}`);
    return res.data;
  },

  // Place a bid on a vehicle auction
  async placeBid(id: number, amount: number) {
    const res = await apiClient.post(`/api/dealer/inspection/${id}/bid`, { amount });
    return res.data;
  },

  // Add vehicle to wishlist
  async addToWishlist(id: number) {
    const res = await apiClient.post(`/api/dealer/wishlist/add/${id}`);
    return res.data;
  },

  // Remove vehicle from wishlist
  async removeFromWishlist(id: number) {
    const res = await apiClient.delete(`/api/dealer/wishlist/remove/${id}`);
    return res.data;
  },

  // Update dealer profile (dealership info / owner / mobile)
  async updateProfile(data: {
    dealershipName?: string;
    fullName?: string;
    mobileNumber?: string;
    address?: string;
    area?: string;
    city?: string;
  }) {
    const res = await apiClient.put('/api/dealer/profile', data);
    return res.data;
  },

  // Change dealer password
  async changePassword(data: any) {
    const res = await apiClient.put('/api/dealer/profile/password', data);
    return res.data;
  },

  // Submit seller response (agreed / counter price / message)
  async submitSellerResponse(id: number, payload: { agreed: boolean; counterPrice?: number; message?: string }) {
    try {
      const res = await apiClient.post(`/api/dealer/inspection/${id}/seller-response`, payload);
      return res.data;
    } catch {
      const res = await axios.post(`${API_BASE_URL}/api/public/inspection/${id}/seller-response`, payload);
      return res.data;
    }
  },

  // Submit dealer reply back to admin
  async submitDealerReply(id: number, reply: string) {
    const res = await apiClient.post(`/api/dealer/inspection/${id}/reply`, { reply });
    return res.data;
  },

  // Get public inspection details (no auth)
  async getPublicInspectionDetails(id: number) {
    const res = await axios.get(`${API_BASE_URL}/api/public/inspection/${id}`);
    return res.data;
  },

  // Get dealer notifications
  async getDealerNotifications() {
    const res = await apiClient.get('/api/dealer/notifications');
    return res.data;
  },

  // Mark single dealer notification as read
  async markNotificationAsRead(id: number) {
    const res = await apiClient.put('/api/dealer/notifications/' + id + '/read');
    return res.data;
  },

  // Mark all dealer notifications as read
  async markAllNotificationsAsRead() {
    const res = await apiClient.put('/api/dealer/notifications/mark-all-read');
    return res.data;
  },

  // Download dealer inspection PDF report
  // Android: saved to Downloads folder via system DownloadManager (tap notification to open)
  // iOS: opens in document preview
  async downloadDealerPdf(id: number) {
    const sessionData = await AsyncStorage.getItem('user_session');
    const session = sessionData ? JSON.parse(sessionData) : null;
    const token = session?.token || session?.accessToken || session?.user?.token || session?.jwt || '';

    if (!token) {
      throw new Error('Please login to download reports.');
    }

    const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/dealer/inspection/${id}/pdf`;
    const filename = `Inspection_Report_${id}.pdf`;

    if (Platform.OS === 'android') {
      const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${filename}`;
      try {
        if (await ReactNativeBlobUtil.fs.exists(downloadPath)) {
          await ReactNativeBlobUtil.fs.unlink(downloadPath);
        }
      } catch { /* ignore */ }

      await ReactNativeBlobUtil.config({
        fileCache: false,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadPath,
          title: filename,
          description: `Inspection Report #${id}`,
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', url, {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      });

      return downloadPath;
    } else {
      const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const filePath = `${cacheDir}/${filename}`;
      try {
        if (await ReactNativeBlobUtil.fs.exists(filePath)) {
          await ReactNativeBlobUtil.fs.unlink(filePath);
        }
      } catch { /* ignore */ }

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
        appendExt: 'pdf',
      }).fetch('GET', url, {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      });

      try {
        await ReactNativeBlobUtil.ios.previewDocument(res.path());
      } catch (e: any) {
        console.warn('Could not preview iOS document:', e);
      }
      return res.path();
    }
  },
};