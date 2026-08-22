import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  User
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { resolveMediaUrl, freelancerService } from '../services/freelancerService';
import Video from 'react-native-video';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface AdminFreelancerVehicleDetailScreenProps {
  navigation: any;
  route: any;
  onOpenMenu?: () => void;
}

const inr = (val: number) => '₹ ' + val.toLocaleString('en-IN');

export const AdminFreelancerVehicleDetailScreen: React.FC<AdminFreelancerVehicleDetailScreenProps> = ({ navigation, route, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  const { inspectionId } = route.params || {};

  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  
  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  
  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Bid History
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  const fetchDetails = useCallback(async () => {
    if (!inspectionId) return;
    setLoading(true);
    try {
      let raw: any = null;
      try {
        const fRes = await freelancerService.getInspectionDetails(Number(inspectionId));
        if (fRes?.success && fRes?.data) raw = fRes.data;
        else if (fRes && (fRes.id || fRes.inspectionId || fRes.vehicleDetails)) raw = fRes;
      } catch (e) {
        console.warn('Freelancer details API failed, trying admin fallback...');
      }

      if (!raw) {
        try {
          const aRes = await adminService.getInspectionById(Number(inspectionId));
          raw = aRes?.data || aRes;
        } catch (e) {
          console.warn('Admin getInspectionById also failed');
        }
      }

      if (raw) {
        setPreviewData(raw);
        setBidHistory(raw.bidHistory || raw.bids || []);
      } else {
        showToast({ message: 'Could not load inspection details.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: 'Failed to load details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [inspectionId, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Actions
  const handleApprove = async () => {
    if (!inspectionId) return;
    setActionLoading(true);
    try {
      const res = await adminService.approveInspection(Number(inspectionId));
      if (res.success) {
        showToast({ message: 'Report approved! Vehicle set to READY_FOR_AUCTION.', type: 'success' });
        fetchDetails();
      } else {
        showToast({ message: 'Failed to approve report.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error approving report.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!inspectionId) return;
    if (!rejectionReason.trim()) {
      showToast({ message: 'Please enter a rejection reason.', type: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminService.rejectInspection(Number(inspectionId), rejectionReason.trim());
      if (res.success) {
        showToast({ message: 'Report rejected successfully.', type: 'success' });
        setRejectModalVisible(false);
        fetchDetails();
      } else {
        showToast({ message: 'Failed to reject report.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error rejecting report.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Extract photos & video
  let photoList: { name: string; url: string }[] = [];
  let videoUrl: string = previewData?.videoUrl || '';

  if (!videoUrl && previewData?.inspectionVideos && Array.isArray(previewData.inspectionVideos)) {
    const vidItem = previewData.inspectionVideos.find((v: any) => v.videoUrl && v.captured !== false);
    if (vidItem) {
      videoUrl = vidItem.videoUrl || '';
    }
  }

  const rawPhotos = previewData?.inspectionPhotos || previewData?.photos || [];
  if (Array.isArray(rawPhotos)) {
    rawPhotos.forEach((item: any) => {
      const cat = item.imageCategory || item.displayName || item.photoType || '';
      const url = item.imageUrl || (typeof item === 'string' ? item : '');
      if (!url) return;

      const lowerUrl = url.toLowerCase();
      const isVid =
        cat === 'Engine / Motor Noise' ||
        cat.toLowerCase().includes('video') ||
        /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);

      if (isVid) {
        if (!videoUrl) videoUrl = url;
      } else {
        const resolvedUrl = resolveMediaUrl(url);
        if (resolvedUrl) {
          photoList.push({ name: cat || `Photo #${photoList.length + 1}`, url: resolvedUrl });
        }
      }
    });
  }

  const vehicleDetails = previewData?.vehicleDetails || {};
  const status = previewData?.status || previewData?.vehicleStatus || '';
  const vehicleStatus = previewData?.vehicleStatus || previewData?.status || '';

  const highestBid = previewData?.currentHighestBid || previewData?.highestBidAmount || (bidHistory.length > 0 ? (bidHistory[0].amount || bidHistory[0].bidAmount || 0) : 0);
  const highestBidder = previewData?.currentHighestBidder || (bidHistory.length > 0 ? (bidHistory[0].dealerName || bidHistory[0].dealershipName || bidHistory[0].dealer || bidHistory[0].bidderName || `Dealer #${bidHistory[0].userId}`) : 'No Bids Placed');

  const renderSpecRow = (label: string, value: string | undefined, gold = false) => (
    <View style={styles.specRow}>
      <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.specValue, { color: gold ? '#FFC700' : colors.foreground }]}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#080A0F' : '#F8FAFC' }}>
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Freelancer Vehicle Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentBody}>
          {loading ? (
            <ActivityIndicator color="#FFC700" size="large" style={{ marginVertical: 60 }} />
          ) : !previewData ? (
            <View style={[styles.failCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <Text style={[styles.failText, { color: colors.mutedForeground }]}>Failed to load inspection details.</Text>
            </View>
          ) : (
            <>
              {/* Title Card */}
              <View style={[styles.titleCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.titleName, { color: colors.foreground }]} numberOfLines={1}>
                      {vehicleDetails?.brand} {vehicleDetails?.model} {vehicleDetails?.variant}
                    </Text>
                    <View style={styles.titleMetaRow}>
                      <View style={[styles.regPill, { backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                        <Text style={[styles.regPillText, { color: colors.mutedForeground }]}>
                          {vehicleDetails?.vehicleNumber || `#${inspectionId}`}
                        </Text>
                      </View>
                      {status && (
                        <View style={[styles.statusPill, { backgroundColor: 'rgba(255,199,0,0.15)' }]}>
                          <Text style={[styles.statusPillText, { color: '#FFC700' }]}>{status}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Action Buttons for Admin */}
                <View style={styles.titleActions}>
                  {(status === 'DRAFT' || status === 'PENDING_APPROVAL' || status === 'PENDING') && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFC700' }]} onPress={handleApprove} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.actionBtnText}>Approve</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F43F5E' }]} onPress={() => setRejectModalVisible(true)} disabled={actionLoading}>
                        <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Panel 1: Specs */}
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Vehicle Specifications & Customer Info</Text>
                <View style={styles.panelBody}>
                  {renderSpecRow('Customer Name', vehicleDetails.customerName)}
                  {renderSpecRow('Customer Mobile', vehicleDetails.customerMobileNumber)}
                  {renderSpecRow('Registration Number', vehicleDetails.vehicleNumber || vehicleDetails.registrationNumber || vehicleDetails.regNo, true)}
                  {renderSpecRow('Make & Model', `${vehicleDetails.brand} ${vehicleDetails.model} ${vehicleDetails.variant || ''}`)}
                  {renderSpecRow('Manufacturing Year', vehicleDetails.manufacturingYear || vehicleDetails.year)}
                  {renderSpecRow('Registration Year', vehicleDetails.registrationYear || vehicleDetails.year)}
                  {renderSpecRow('Fuel Type & Transmission', `${vehicleDetails.fuelType || vehicleDetails.fuel || 'Petrol'} / ${vehicleDetails.transmission || 'Manual'}`)}
                  {renderSpecRow('Odometer Reading', (vehicleDetails.odometerReading || vehicleDetails.odometer) ? `${vehicleDetails.odometerReading || vehicleDetails.odometer} km` : 'N/A')}
                  {renderSpecRow('Owner Profile Status', vehicleDetails.ownerProfileStatus || vehicleDetails.ownerName || '1st Owner')}
                  {renderSpecRow('Insurance Status', vehicleDetails.insuranceStatus || vehicleDetails.insuranceValidity || 'Valid')}
                  {renderSpecRow('Suggested / Expected Price', vehicleDetails.suggestedPrice || vehicleDetails.price ? inr(vehicleDetails.suggestedPrice || vehicleDetails.price) : 'N/A', true)}
                  {renderSpecRow('Location', vehicleDetails.location)}
                  {renderSpecRow('Under Hypothecation', vehicleDetails.underHypothecation || 'No')}
                  {renderSpecRow('Accidental History', vehicleDetails.accidental || 'No')}
                  {renderSpecRow('RTO Information', vehicleDetails.rtoInformation || vehicleDetails.rto)}
                </View>
              </View>

              {/* Panel 2: Photos */}
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Uploaded Photos Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                  {photoList.length === 0 ? (
                    <Text style={{ color: colors.mutedForeground, fontStyle: 'italic', paddingHorizontal: 16, paddingTop: 16 }}>No photos provided.</Text>
                  ) : (
                    photoList.map((p, i) => (
                      <TouchableOpacity key={i} onPress={() => setLightbox(p.url)} activeOpacity={0.8} style={{ width: 140 }}>
                        <Image source={{ uri: p.url }} style={{ width: 140, height: 100, borderRadius: 12, backgroundColor: '#1A1D28' }} />
                        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>{p.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* Panel 3: Video */}
              {videoUrl ? (
                <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>Walkaround Video</Text>
                  <View style={{ padding: 16 }}>
                    <View style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden' }}>
                      <Video source={{ uri: resolveMediaUrl(videoUrl) || videoUrl }} style={{ width: '100%', height: '100%' }} controls resizeMode="contain" />
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Panel 4: Telemetry */}
              <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.panelTitle, { color: colors.foreground, padding: 0 }]}>Live Auction & Bid History Telemetry</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>Complete list of all bids placed by registered dealers on this freelancer vehicle.</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,199,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFC700' }}>Total Bids: {previewData?.totalBids || bidHistory.length || 0}</Text>
                  </View>
                </View>
                
                <View style={{ padding: 16, gap: 16 }}>
                  
                  {/* Telemetry Summary Grid */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 4 }} numberOfLines={1}>Current Highest</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#10B981' }}>{highestBid > 0 ? inr(highestBid) : 'No Bids'}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 4 }} numberOfLines={1}>Highest Bidder</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.foreground }} numberOfLines={1}>{highestBidder}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 4 }} numberOfLines={1}>Suggested Price</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.foreground }}>{vehicleDetails?.suggestedPrice || vehicleDetails?.price ? inr(vehicleDetails.suggestedPrice || vehicleDetails.price) : 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Bid History List */}
                  {bidHistory.length > 0 ? (
                    bidHistory.map((bid, idx) => {
                      const isTop = idx === 0;
                      const dealerName = bid.dealerName || bid.dealershipName || bid.dealer || bid.bidderName || `Dealer #${bid.userId}`;
                      const amountVal = bid.amount || bid.bidAmount || 0;

                      return (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: isTop ? 'rgba(255,199,0,0.05)' : 'transparent', paddingHorizontal: isTop ? 12 : 0, borderRadius: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isTop ? '#FFC700' : (isDark ? '#1A1D28' : '#E8EBF0'), alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontSize: 14, fontWeight: '900', color: isTop ? '#0D0E12' : colors.mutedForeground }}>#{idx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.foreground, marginBottom: 4 }} numberOfLines={1}>{dealerName}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isTop ? (
                                  <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#10B981' }}>Winning Bid</Text>
                                  </View>
                                ) : (
                                  <View style={{ backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: colors.mutedForeground }}>Outbid</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#10B981' }}>{inr(amountVal)}</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={{ paddingVertical: 32, alignItems: 'center', backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>No bids have been placed on this vehicle yet.</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal visible={lightbox !== null} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setLightbox(null)}>
            <X size={32} color="#FFF" />
          </TouchableOpacity>
          {lightbox && <Image source={{ uri: lightbox }} style={{ width: '100%', height: '70%' }} resizeMode="contain" />}
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: isDark ? '#1A1D28' : '#FFF', padding: 20, borderRadius: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground, marginBottom: 12 }}>Reject Report</Text>
            <TextInput
              style={{ backgroundColor: isDark ? '#0D0E12' : '#F0F2F7', color: colors.foreground, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.mutedForeground}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => setRejectModalVisible(false)} disabled={actionLoading}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12, backgroundColor: '#F43F5E', borderRadius: 8 }} onPress={handleReject} disabled={actionLoading}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{actionLoading ? 'Rejecting...' : 'Confirm Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  contentBody: { paddingBottom: 60 },
  failCard: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  failText: { fontSize: 14, fontWeight: '600' },
  titleCard: { margin: 16, padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  titleName: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  titleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  regPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '900' },
  titleActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  pdfBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,199,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  panel: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  panelTitle: { fontSize: 15, fontWeight: '800', padding: 16, paddingBottom: 0 },
  panelBody: { padding: 16, gap: 12 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)', paddingBottom: 10 },
  specLabel: { fontSize: 13, fontWeight: '600' },
  specValue: { fontSize: 14, fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 16 },
});
