import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import { API_BASE_URL, apiClient } from '../config/api';

export const adminService = {
  // Get all inspections (telemetry inventory list)
  async getSubmittedInspections() {
    const res = await apiClient.get('/api/admin/inspections');
    return res.data;
  },

  // Get all freelancer inspections for admin
  async getFreelancerInspections() {
    const res = await apiClient.get('/api/freelancer/inspection');
    return res.data;
  },

  // Get admin notifications
  async getAdminNotifications() {
    const res = await apiClient.get('/api/admin/notifications');
    return res.data;
  },

  // Mark single admin notification as read
  async markNotificationAsRead(id: number) {
    const res = await apiClient.put('/api/admin/notifications/' + id + '/read');
    return res.data;
  },

  // Mark all admin notifications as read
  async markAllNotificationsAsRead() {
    const res = await apiClient.put('/api/admin/notifications/mark-all-read');
    return res.data;
  },

  // Get bid history for a vehicle
  async getVehicleBidHistory(id: number) {
    try {
      const res = await apiClient.get(`/api/admin/inspection/${id}/bids`);
      return res.data;
    } catch {
      try {
        const res2 = await apiClient.get(`/api/dealer/inspection/${id}/bids`);
        return res2.data;
      } catch {
        return { success: false, data: [] };
      }
    }
  },

  // Get a single inspection (auction detail page)
  async getInspectionById(id: number) {
    const res = await apiClient.get(`/api/admin/inspection/${id}`);
    return res.data;
  },

  // Get all registered dealers list
  async getRegisteredDealers() {
    const res = await apiClient.get('/api/admin/dealers');
    return res.data;
  },

  // Get all registered inspectors list
  async getRegisteredInspectors() {
    const res = await apiClient.get('/api/admin/inspectors');
    return res.data;
  },

  // Get all registered freelancers list
  async getRegisteredFreelancers() {
    const res = await apiClient.get('/api/admin/freelancers');
    return res.data;
  },

  // Delete a registered inspector account
  async deleteAdminInspector(id: number) {
    const res = await apiClient.delete(`/api/admin/inspector/${id}`);
    return res.data;
  },

  // Delete a registered dealer account
  async deleteAdminDealer(id: number) {
    const res = await apiClient.delete(`/api/admin/dealer/${id}`);
    return res.data;
  },

  // Import dealers from an Excel file (multipart/form-data)
  async importDealersExcel(formData: FormData) {
    const res = await apiClient.post('/api/admin/dealers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Get bid history for a live auction room
  async getAdminBidHistory(inspectionId: number) {
    const res = await apiClient.get(`/api/admin/inspection/${inspectionId}/bids`);
    return res.data;
  },

  // Update vehicle auction status (e.g. SOLD OUT)
  async updateInspectionVehicleStatus(inspectionId: number, vehicleStatus: string) {
    const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/vehicle-status`, { vehicleStatus });
    return res.data;
  },

  // Send communication message to the winning dealer
  async sendAdminDealerMessage(inspectionId: number, message: string) {
    const res = await apiClient.post(`/api/admin/inspection/${inspectionId}/dealer-message`, { message });
    return res.data;
  },

  // Approve inspection
  async approveInspection(inspectionId: number) {
    const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/approve`);
    return res.data;
  },

  // Reject inspection
  async rejectInspection(inspectionId: number, reason: string) {
    const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/reject`, { reason });
    return res.data;
  },

  // Start live auction (Go Live)
  async startLiveAuction(inspectionId: number, durationMinutes?: number) {
    const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/go-live`, null, {
      params: durationMinutes ? { duration: durationMinutes } : undefined
    });
    return res.data;
  },

  // Stop live auction
  async stopLiveAuction(inspectionId: number) {
    try {
      const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/stop-auction`);
      return res.data;
    } catch {
      const res = await apiClient.put(`/api/admin/inspection/${inspectionId}/stop`);
      return res.data;
    }
  },

  // Download & open the admin inspection PDF report
  async downloadAdminPdf(id: number) {
    const sessionData = await AsyncStorage.getItem('user_session');
    const session = sessionData ? JSON.parse(sessionData) : null;
    const token = session?.token || '';

    if (!token) {
      throw new Error('Please login to download admin reports.');
    }

    const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/admin/inspection/${id}/pdf`;
    const filename = `Inspection_Report_${id}.pdf`;

    const docDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
    const filePath = `${docDir}/${filename}`;

    try {
      const exists = await ReactNativeBlobUtil.fs.exists(filePath);
      if (exists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);
      }
    } catch {
      // ignore unlink error
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
          description: `Admin Inspection Report #${id}`,
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
          // ignore scanFile error
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
        // Fallback
      }
      throw new Error(errorMsg);
    }
  },
};
