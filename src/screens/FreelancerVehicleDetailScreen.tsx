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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertCircle,
  Camera,
    X
} from 'lucide-react-native';
import { freelancerService, resolveMediaUrl } from '../services/freelancerService';
import Video from 'react-native-video';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface FreelancerVehicleDetailScreenProps {
  navigation: any;
  route: any;
  onOpenMenu?: () => void;
}

const inr = (val: number) => "Rs. " + val.toLocaleString('en-IN');
export const FreelancerVehicleDetailScreen: React.FC<FreelancerVehicleDetailScreenProps> = ({ navigation, route, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  const { inspectionId } = route.params || {};

  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!inspectionId) return;
    setLoading(true);
    try {
      const res = await freelancerService.getInspectionDetails(Number(inspectionId));
      if (res.success && res.data) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      showToast({ message: 'Failed to load inspection details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [inspectionId, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const vehicleDetails = previewData?.vehicleDetails || {};
  
  // Extract Photos & Video
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
      const cat = item.imageCategory || item.displayName || item.photoType || "";
      const url = item.imageUrl || (typeof item === "string" ? item : "");
      if (!url) return;

      const lowerUrl = url.toLowerCase();
      const isVid =
        cat === "Engine / Motor Noise" ||
        cat.toLowerCase().includes("video") ||
        /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);

      if (isVid) {
        if (!videoUrl) videoUrl = url;
      } else {
        const resolvedUrl = resolveMediaUrl(url);
        if (resolvedUrl) {
          photoList.push({
            name: cat || `Photo #${photoList.length + 1}`,
            url: resolvedUrl,
          });
        }
      }
    });
  }

  const status = (previewData?.status || '').toUpperCase();

  const renderSpecGrid = (rows: { label: string; value: any; gold?: boolean; span?: boolean }[]) => (
    <View style={styles.specGrid}>
      {rows.map((r, idx) => (
        <View key={idx} style={[styles.specCell, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }, r.span && { width: '100%' }]}>
          <Text style={[styles.specCellLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
          <Text
            style={[
              styles.specCellValue,
              r.gold ? styles.specCellValueGold : { color: colors.foreground },
            ]}
          >
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Vehicle Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFC700" />
        </View>
      ) : !previewData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.mutedForeground }}>Could not load data.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Status Alert */}
          {status === 'REJECTED' && previewData.rejectionReason && (
            <View style={[styles.rejectBanner, { backgroundColor: 'rgba(244,63,94,0.1)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AlertCircle size={16} color="#F43F5E" />
                <Text style={{ color: '#F43F5E', fontWeight: 'bold' }}>Submission Rejected</Text>
              </View>
              <Text style={{ color: '#F43F5E', fontSize: 13, lineHeight: 18 }}>Reason: {previewData.rejectionReason}</Text>
            </View>
          )}

          {/* Vehicle Identification */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Vehicle Identification</Text>
            </View>
            <View style={styles.panelBody}>
              {renderSpecGrid([
                { label: 'Customer Name', value: vehicleDetails.customerName || 'N/A' },
                { label: 'Customer Mobile', value: vehicleDetails.customerMobileNumber || 'N/A' },
                { label: 'Registration Number', value: vehicleDetails.vehicleNumber || vehicleDetails.registrationNumber || 'N/A', gold: true },
                { label: 'Make & Model', value: `${vehicleDetails.brand || ''} ${vehicleDetails.model || ''} ${vehicleDetails.variant || ''}`.trim() || 'N/A' },
                { label: 'Manufacturing Year', value: vehicleDetails.manufacturingYear || 'N/A' },
                { label: 'Registration Year', value: vehicleDetails.registrationYear || 'N/A' },
                { label: 'Fuel Type & Transmission', value: `${vehicleDetails.fuelType || 'Petrol'} / ${vehicleDetails.transmission || 'Manual'}` },
                { label: 'Odometer Reading', value: vehicleDetails.odometerReading ? `${vehicleDetails.odometerReading} km` : 'N/A' },
                { label: 'Owner Profile Status', value: vehicleDetails.ownerName || '1st Owner' },
                { label: 'Insurance Validity', value: vehicleDetails.insuranceStatus || 'Valid' },
                { label: 'Expected Price', value: vehicleDetails.suggestedPrice ? inr(vehicleDetails.suggestedPrice) : 'N/A', gold: true },
                { label: 'Location', value: vehicleDetails.location || 'N/A' },
                { label: 'Under Hypothecation', value: vehicleDetails.underHypothecation || 'No' },
                { label: 'Accidental History', value: vehicleDetails.accidental || 'No' },
                { label: 'RTO Information', value: vehicleDetails.rtoInformation || 'N/A', span: true },
              ])}
            </View>
          </View>

          {/* Uploaded Basic Photos */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Uploaded Basic Photos</Text>
              <Text style={[styles.panelSubtitle, { color: colors.mutedForeground }]}>Up to 10 photos submitted</Text>
            </View>
            <View style={styles.panelBody}>
              {photoList.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: 'bold' }}>No photos uploaded for this vehicle.</Text>
                </View>
              ) : (
                <View style={styles.photoGrid}>
                  {photoList.map((photo, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.photoCard, { borderColor: colors.border }]}
                      onPress={() => setLightbox(photo.url)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: photo.url }} style={styles.photoImg} />
                      <View style={styles.photoLabelWrap}>
                        <Text style={styles.photoLabel} numberOfLines={1}>{photo.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Walkaround Video Panel */}
          {videoUrl && resolveMediaUrl(videoUrl) && (
            <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Walkaround Video</Text>
                <Text style={[styles.panelSubtitle, { color: colors.mutedForeground }]}>1 short video submitted</Text>
              </View>
              <View style={[styles.panelBody, { paddingBottom: 16 }]}>
                <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: colors.border }}>
                  <Video
                    source={{ uri: resolveMediaUrl(videoUrl) || '' }}
                    style={{ width: '100%', height: 250 }}
                    controls={true}
                    resizeMode="contain"
                    paused={true}
                  />
                </View>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* Full Screen Image Lightbox */}
      <Modal visible={lightbox !== null} transparent={true} animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setLightbox(null)}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {lightbox && (
            <Image source={{ uri: lightbox }} style={styles.lightboxImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  rejectBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  panelSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  panelBody: {
    padding: 16,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specCell: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'center',
  },
  specCellLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  specCellValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  specCellValueGold: {
    color: '#FFC700',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyBox: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    aspectRatio: 4/3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoLabelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  photoLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 12,
    zIndex: 10,
  },
  lightboxImg: {
    width: '100%',
    height: '80%',
  },
});
