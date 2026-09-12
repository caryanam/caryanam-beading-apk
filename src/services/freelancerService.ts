import { apiClient, API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

// Resolve possibly-relative media URLs returned by the API to absolute ones
export const resolveMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

export const freelancerService = {
  // Get all freelancer's evaluations (drafts & uploads)
  async getMyInspections() {
    try {
      const res = await apiClient.get('/api/freelancer/inspection');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        try {
          const altRes = await apiClient.get('/api/freelancer/vehicles');
          return altRes.data;
        } catch {
          return { success: true, data: [] };
        }
      }
      return { success: false, data: [] };
    }
  },

  // Get full inspection report details
  async getInspectionDetails(id: number | string) {
    try {
      const res = await apiClient.get(`/api/freelancer/inspection/${id}`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.get(`/api/freelancer/vehicles/${id}`);
        return altRes.data;
      }
      throw err;
    }
  },

  // Create a new inspection draft
  async saveDraft(payload: any) {
    try {
      const res = await apiClient.post('/api/freelancer/inspection', payload);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.post('/api/freelancer/vehicles', payload);
        return altRes.data;
      }
      throw err;
    }
  },

  // Update an existing inspection draft
  async updateDraft(id: number | string, payload: any) {
    try {
      const res = await apiClient.put(`/api/freelancer/inspection/${id}`, payload);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.put(`/api/freelancer/vehicles/${id}`, payload);
        return altRes.data;
      }
      throw err;
    }
  },

  // Upload a photo/video for a section of the inspection (multipart)
  async uploadImage(id: number | string, category: string, file: any) {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('file', file);
    try {
      const res = await apiClient.post(`/api/freelancer/inspection/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.post(`/api/freelancer/vehicles/${id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return altRes.data;
      }
      throw err;
    }
  },

  // Submit the inspection report to the admin for approval
  async submitReport(id: number | string) {
    try {
      const res = await apiClient.post(`/api/freelancer/inspection/${id}/submit`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.post(`/api/freelancer/vehicles/${id}/submit`);
        return altRes.data;
      }
      throw err;
    }
  },

  // Delete an inspection draft permanently
  async deleteDraft(id: number | string) {
    try {
      const res = await apiClient.delete(`/api/freelancer/inspection/${id}`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.delete(`/api/freelancer/vehicles/${id}`);
        return altRes.data;
      }
      throw err;
    }
  },

  // Download the inspection PDF report
  // Android: saved to Downloads folder via system DownloadManager (tap notification to open)
  // iOS: opens in document preview
  async downloadPdf(id: number) {
    const sessionData = await AsyncStorage.getItem('user_session');
    const session = sessionData ? JSON.parse(sessionData) : null;
    const token = session?.token || '';

    if (!token) {
      throw new Error('Please login to download reports.');
    }

    const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/freelancer/inspection/${id}/pdf`;
    const filename = `Freelancer_Report_${id}.pdf`;

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
          description: `Freelancer Report #${id}`,
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

      const status = res.info().status;
      if (status === 200) {
        try {
          await ReactNativeBlobUtil.ios.previewDocument(res.path());
        } catch (e: any) {
          console.warn('Could not preview iOS document:', e);
        }
        return res.path();
      } else {
        let errorMsg = `Failed with HTTP status ${status}`;
        try {
          const rawText = await res.text();
          const parsed = JSON.parse(rawText);
          if (parsed?.message) errorMsg = parsed.message;
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }
    }
  },

  // Get freelancer stats
  async getStats() {
    try {
      const res = await apiClient.get('/api/freelancer/inspection/stats');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        const altRes = await apiClient.get('/api/freelancer/stats');
        return altRes.data;
      }
      throw err;
    }
  },

  // Get freelancer profile
  async getProfile() {
    const res = await apiClient.get('/api/freelancer/profile');
    return res.data;
  },

  // Update freelancer profile
  async updateProfile(data: { fullName: string; mobileNumber: string }) {
    const res = await apiClient.put('/api/freelancer/profile', data);
    return res.data;
  },

  // Change freelancer password
  async changePassword(data: any) {
    const res = await apiClient.put('/api/freelancer/profile/password', data);
    return res.data;
  },

  // Get freelancer notifications
  async getFreelancerNotifications() {
    try {
      const res = await apiClient.get('/api/freelancer/notifications');
      return res.data;
    } catch (err: any) {
      try {
        const altRes = await apiClient.get('/api/freelancer/inspection/notifications');
        return altRes.data;
      } catch {
        return { success: true, data: [] };
      }
    }
  },

  // Mark single freelancer notification as read
  async markNotificationAsRead(id: number) {
    try {
      const res = await apiClient.put(`/api/freelancer/notifications/${id}/read`);
      return res.data;
    } catch (err: any) {
      try {
        const altRes = await apiClient.post(`/api/freelancer/notifications/${id}/read`);
        return altRes.data;
      } catch {
        return { success: true };
      }
    }
  },

  // Mark all freelancer notifications as read
  async markAllNotificationsAsRead() {
    try {
      const res = await apiClient.put('/api/freelancer/notifications/mark-all-read');
      return res.data;
    } catch (err: any) {
      try {
        const altRes = await apiClient.post('/api/freelancer/notifications/mark-all-read');
        return altRes.data;
      } catch {
        return { success: true };
      }
    }
  },
};
