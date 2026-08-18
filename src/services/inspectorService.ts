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

export const inspectorService = {
  // Get all inspector's evaluations (drafts & uploads)
  async getMyInspections() {
    const res = await apiClient.get('/api/inspector/inspection');
    return res.data;
  },

  // Get full inspection report details (all 5 sections + photos)
  async getInspectionDetails(id: number | string) {
    const res = await apiClient.get(`/api/inspector/inspection/${id}`);
    return res.data;
  },

  // Create a new inspection draft
  async saveDraft(payload: any) {
    const res = await apiClient.post('/api/inspector/inspection', payload);
    return res.data;
  },

  // Update an existing inspection draft
  async updateDraft(id: number | string, payload: any) {
    const res = await apiClient.put(`/api/inspector/inspection/${id}`, payload);
    return res.data;
  },

  // Upload a photo/video for a section of the inspection (multipart)
  async uploadImage(id: number | string, category: string, file: any) {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('file', file);
    const res = await apiClient.post(`/api/inspector/inspection/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Submit the inspection report to the admin for approval
  async submitReport(id: number | string) {
    const res = await apiClient.post(`/api/inspector/inspection/${id}/submit`);
    return res.data;
  },

  // Delete an inspection draft permanently
  async deleteDraft(id: number | string) {
    const res = await apiClient.delete(`/api/inspector/inspection/${id}`);
    return res.data;
  },

  // Download & open the inspection PDF report
  async downloadPdf(id: number) {
    const sessionData = await AsyncStorage.getItem('user_session');
    const session = sessionData ? JSON.parse(sessionData) : null;
    const token = session?.token || '';

    if (!token) {
      throw new Error('Please login to download reports.');
    }

    const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/inspector/inspection/${id}/pdf`;
    const filename = `Inspection_Report_${id}.pdf`;

    // Always use DocumentDir to ensure file system permissions on both Android and iOS
    const docDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
    const filePath = `${docDir}/${filename}`;

    // Clean up existing file if present
    try {
      const exists = await ReactNativeBlobUtil.fs.exists(filePath);
      if (exists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);
      }
    } catch {
      // ignore unlink failure
    }

    const config = Platform.OS === 'android'
      ? {
        fileCache: true,
        path: filePath,
        appendExt: 'pdf',
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${filename}`,
          description: `Inspection Report #${id}`,
          title: filename,
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }
      : {
        fileCache: true,
        path: filePath,
        appendExt: 'pdf',
      };

    const res = await ReactNativeBlobUtil.config(config).fetch('GET', url, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    });

    const status = res.info().status;
    if (status === 200) {
      const targetPath = res.path() || filePath;
      if (Platform.OS === 'android') {
        try {
          await ReactNativeBlobUtil.fs.scanFile([{ path: targetPath, mime: 'application/pdf' }]);
        } catch {
          // ignore scanFile failure
        }
        try {
          await ReactNativeBlobUtil.android.actionViewIntent(targetPath, 'application/pdf');
        } catch (e: any) {
          console.warn('Could not launch PDF viewer intent:', e);
        }
      } else {
        try {
          await ReactNativeBlobUtil.ios.previewDocument(targetPath);
        } catch (e: any) {
          console.warn('Could not preview iOS document:', e);
        }
      }
      return targetPath;
    } else {
      let errorMsg = `Failed with HTTP status ${status}`;
      try {
        const rawText = await res.text();
        const parsed = JSON.parse(rawText);
        if (parsed?.message) errorMsg = parsed.message;
      } catch {
        // Fallback to errorMsg
      }
      throw new Error(errorMsg);
    }
  },

  // Get inspector stats directly
  async getStats() {
    const res = await apiClient.get('/api/inspector/inspection/stats');
    return res.data;
  },

  // Get inspector profile
  async getProfile() {
    const res = await apiClient.get('/api/inspector/profile');
    return res.data;
  },

  // Update inspector profile
  async updateProfile(data: { fullName: string; mobileNumber: string }) {
    const res = await apiClient.put('/api/inspector/profile', data);
    return res.data;
  },

  // Change inspector password
  async changePassword(data: any) {
    const res = await apiClient.put('/api/inspector/profile/password', data);
    return res.data;
  },

  // Get inspector notifications
  async getInspectorNotifications() {
    const res = await apiClient.get('/api/inspector/inspection/notifications');
    return res.data;
  },

  // Mark single inspector notification as read
  async markNotificationAsRead(id: number) {
    const res = await apiClient.put('/api/inspector/inspection/notifications/' + id + '/read');
    return res.data;
  },

  // Mark all inspector notifications as read
  async markAllNotificationsAsRead() {
    const res = await apiClient.put('/api/inspector/inspection/notifications/mark-all-read');
    return res.data;
  },
};
