import { apiClient, API_BASE_URL } from '../config/api';
import axios from 'axios';

export const dealerService = {
  // Get live auctions in marketplace
  async getMarketplace() {
    const res = await apiClient.get('/api/dealer/inspections');
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
};
