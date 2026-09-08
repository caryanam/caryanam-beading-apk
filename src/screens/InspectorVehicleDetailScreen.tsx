import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Download,
  Edit3,
  Eye,
  CheckCircle2,
  Star,
  AlertCircle,
  Camera,
  Video as VideoIcon,
} from 'lucide-react-native';
import { inspectorService, resolveMediaUrl } from '../services/inspectorService';
import Video from 'react-native-video';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface InspectorVehicleDetailScreenProps {
  navigation: any;
  route: any;
  onOpenMenu: () => void;
}

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Draft';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const detailSteps = [
  { title: 'Vehicle Specs', subtitle: 'Registration & owner details' },
  { title: 'Exterior Body', subtitle: '32-point panel & side photos' },
  { title: 'Mechanical', subtitle: 'Engine, oil & motor bay photos' },
  { title: 'Tyres', subtitle: 'Tread depth % & toolkit' },
  { title: 'Interior & Electrical', subtitle: 'Cabin, electrical & remarks' },
];

const panelConditionColors: Record<string, { color: string; bg: string }> = {
  OK: { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  DAMAGED: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  RUST: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  REPAINTED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  CHANGED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  SCRATCH: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  DENT: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  NA: { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const slotPhotoTypeMap: Record<string, string[]> = {
  frontSide: ['FRONT_VIEW', 'frontSide', 'Front', 'FRONT SIDE IMAGE', 'FRONT'],
  rightSide: ['RIGHT_FRONT_VIEW', 'rightSide', 'Right', 'RIGHT SIDE IMAGE', 'RIGHT'],
  leftSide: ['LEFT_FRONT_VIEW', 'leftSide', 'Left', 'LEFT SIDE IMAGE', 'LEFT'],
  rearSide: ['REAR_VIEW', 'rearSide', 'Rear', 'REAR SIDE IMAGE', 'REAR'],
  roofTop: ['ROOF_VIEW', 'roofTop', 'Roof', 'ROOF TOP IMAGE', 'ROOF'],
  engineImg: ['ENGINE_IMAGE', 'engineImg', 'Engine', 'ENGINE / MOTOR IMG', 'ENGINE ROOM PHOTO', 'ENGINE'],
  batteryImg: ['BATTERY_IMAGE', 'batteryImg', 'Battery', 'BATTERY IMG', 'BATTERY BAY PHOTO', 'BATTERY'],
  rfTyreImg: ['FRONT_RIGHT_TYRE', 'rfTyreImg', 'Front Right', 'RIGHT SIDE FRONT TYRE IMG', 'RF_TYRE', 'FRONT_RIGHT'],
  rrTyreImg: ['REAR_RIGHT_TYRE', 'rrTyreImg', 'Rear Right', 'RIGHT SIDE REAR TYRE IMG', 'RR_TYRE', 'REAR_RIGHT'],
  lrTyreImg: ['REAR_LEFT_TYRE', 'lrTyreImg', 'Rear Left', 'LEFT SIDE REAR TYRE IMG', 'LR_TYRE', 'REAR_LEFT'],
  lfTyreImg: ['FRONT_LEFT_TYRE', 'lfTyreImg', 'Front Left', 'LEFT SIDE FRONT TYRE IMG', 'LF_TYRE', 'FRONT_LEFT'],
  spareWheelImg: ['SPARE_WHEEL', 'spareWheelImg', 'Spare', 'SPARE WHEEL IMG', 'SPARE'],
  tyresGeneralImg: ['TYRES_OVERVIEW', 'tyresGeneralImg', 'Tyres', 'TYRES OVERVIEW IMAGE', 'TYRES'],
  odometerImg: ['ODOMETER_IMAGE', 'odometerImg', 'Odometer', 'ODOMETER IMG', 'ODOMETER READING PHOTO', 'ODOMETER'],
  acImg: ['AC_CONTROL_IMAGE', 'acImg', 'AC Control', 'AC IMAGE', 'AC CONTROL PANEL PHOTO', 'AC'],
};

const slotToCategoryMap: Record<string, string> = {
  frontSide: 'Front',
  rightSide: 'Right',
  rearSide: 'Rear',
  leftSide: 'Left',
  roofTop: 'Roof',
  engineImg: 'Engine',
  batteryImg: 'Battery',
  rfTyreImg: 'Front Right',
  rrTyreImg: 'Rear Right',
  lrTyreImg: 'Rear Left',
  lfTyreImg: 'Front Left',
  spareWheelImg: 'Spare',
  tyresGeneralImg: 'Tyres',
  odometerImg: 'Odometer',
  acImg: 'AC Control',
};

const photoTypeToSlotKeyMap: Record<string, string> = {
  FRONT_VIEW: 'frontSide',
  RIGHT_FRONT_VIEW: 'rightSide',
  REAR_VIEW: 'rearSide',
  LEFT_FRONT_VIEW: 'leftSide',
  ROOF_VIEW: 'roofTop',
  ENGINE_IMAGE: 'engineImg',
  BATTERY_IMAGE: 'batteryImg',
  FRONT_RIGHT_TYRE: 'rfTyreImg',
  REAR_RIGHT_TYRE: 'rrTyreImg',
  REAR_LEFT_TYRE: 'lrTyreImg',
  FRONT_LEFT_TYRE: 'lfTyreImg',
  SPARE_WHEEL: 'spareWheelImg',
  TYRES_OVERVIEW: 'tyresGeneralImg',
  ODOMETER_IMAGE: 'odometerImg',
  AC_CONTROL_IMAGE: 'acImg',
};

const exteriorPanelsOrder = [
  /* ── Front Side ── */
  'Front Bonnet Hood',
  'Front Bumper',
  'Front Wind Shield',

  /* ── Right Side ── */
  'Right Side Fender',
  'Right Side Front Door',
  'Right Side Front Window',
  'Right Side Rear Door',
  'Right Side Quarter Panel',
  'Right Side Quarter Panel Window',
  'Right Side A Pillar',
  'Right Side B Pillar',
  'Right Side C Pillar',
  'Right Side Running Board',
  'Right Side Mirror',

  /* ── Left Side ── */
  'Left Side Fender',
  'Left Side Front Door',
  'Left Side Rear Door',
  'Left Side Quarter Panel',
  'Left Side Quarter Panel Window',
  'Left Side A Pillar',
  'Left Side B Pillar',
  'Left Side C Pillar',
  'Left Side Running Board',
  'Left Side Mirror',

  /* ── Other (Rear, Roof, Structure & Identification) ── */
  'Trunk Door (Dicky)',
  'Rear Bumper',
  'Rear Wind Shield',
  'Roof Top',
  'Chassis Embossing',
  'VIN Plate',
  'Under Body Damages',
];

const sortExteriorPanels = (panels: any[]) => {
  if (!panels || !Array.isArray(panels)) return [];
  return [...panels].sort((a, b) => {
    const nameA = (a.panelName || a.name || '').trim();
    const nameB = (b.panelName || b.name || '').trim();
    const idxA = exteriorPanelsOrder.indexOf(nameA);
    const idxB = exteriorPanelsOrder.indexOf(nameB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return nameA.localeCompare(nameB);
  });
};

const imageSlotsConfig = [
  { key: 'frontSide', label: 'FRONT SIDE IMAGE', step: 1 },
  { key: 'rightSide', label: 'RIGHT SIDE IMAGE', step: 1 },
  { key: 'leftSide', label: 'LEFT SIDE IMAGE', step: 1 },
  { key: 'rearSide', label: 'REAR SIDE IMAGE', step: 1 },
  { key: 'roofTop', label: 'ROOF TOP IMAGE', step: 1 },
  { key: 'engineImg', label: 'ENGINE / MOTOR IMG', step: 2 },
  { key: 'batteryImg', label: 'BATTERY IMG', step: 2 },
  { key: 'rfTyreImg', label: 'RIGHT SIDE FRONT TYRE IMG', step: 3 },
  { key: 'rrTyreImg', label: 'RIGHT SIDE REAR TYRE IMG', step: 3 },
  { key: 'lrTyreImg', label: 'LEFT SIDE REAR TYRE IMG', step: 3 },
  { key: 'lfTyreImg', label: 'LEFT SIDE FRONT TYRE IMG', step: 3 },
  { key: 'spareWheelImg', label: 'SPARE WHEEL IMG', step: 3 },
  { key: 'tyresGeneralImg', label: 'TYRES OVERVIEW IMAGE', step: 3 },
  { key: 'odometerImg', label: 'ODOMETER IMG', step: 4 },
  { key: 'acImg', label: 'AC IMAGE', step: 4 },
];

const mechanicalLabels: { label: string; key: string }[] = [
  { label: 'Engine / Motor Status', key: 'engineStatus' },
  { label: 'Engine Oil', key: 'engineOil' },
  { label: 'Brakes Oil', key: 'brakeOil' },
  { label: 'Steering Oil', key: 'steeringOil' },
  { label: 'Coolant', key: 'coolant' },
  { label: 'Brakes Booster', key: 'brakeBooster' },
  { label: 'Brakes Working', key: 'brakeWorking' },
  { label: 'Apron Condition', key: 'apron' },
  { label: 'Chassis Alignment', key: 'chassis' },
  { label: 'Suspension', key: 'suspension' },
  { label: 'Suspension Bushing', key: 'bush' },
  { label: 'Oil Leakage', key: 'leakage' },
  { label: 'Exhaust Smoke Color', key: 'smoke' },
  { label: 'Manual Transmission Fluid Level', key: 'transmission' },
  { label: 'Differential Fluid Level', key: 'differential' },
  { label: 'Fluid Leakages', key: 'fluidLeakage' },
  { label: 'Steering Gearbox & Linkage', key: 'gearbox' },
  { label: 'Driveline / Axle', key: 'axle' },
  { label: 'Engine / Motor Noise', key: 'engineNoise' },
];

const tyreItems = (t: any) => [
  { label: 'Front Right Tyre', brand: t?.frontRightBrand, tread: t?.frontRightTread },
  { label: 'Rear Right Tyre', brand: t?.rearRightBrand, tread: t?.rearRightTread },
  { label: 'Rear Left Tyre', brand: t?.rearLeftBrand, tread: t?.rearLeftTread },
  { label: 'Front Left Tyre', brand: t?.frontLeftBrand, tread: t?.frontLeftTread },
  { label: 'Spare Wheel', brand: t?.spareBrand, tread: t?.spareTread },
];

const emergencyItems = (t: any) => [
  { name: 'Jack', present: t?.hasJack },
  { name: 'Handle', present: t?.hasHandle },
  { name: 'Tool Kit', present: t?.hasToolkit },
  { name: 'First Aid Box', present: t?.hasFirstAidBox },
  { name: 'Emergency Triangle', present: t?.hasTriangle },
];

const electricalItems = (i: any) => [
  { label: 'Push Start Button', val: i?.pushButton },
  { label: 'Sunroof', val: i?.sunroof },
  { label: 'Right Side Tail Lamp', val: i?.rightTailLamp },
  { label: 'Left Side Tail Lamp', val: i?.leftTailLamp },
  { label: 'Right Side Head Light', val: i?.rightHeadLamp },
  { label: 'Left Side Head Light', val: i?.leftHeadLamp },
  { label: 'Right Indicator', val: i?.indicators },
  { label: 'Left Indicator', val: i?.indicators },
  { label: 'Boot Floor', val: i?.bootFloor },
  { label: 'Dashboard', val: i?.dashboard },
  { label: 'Left Side Fog Lamp', val: i?.fogLamps },
  { label: 'Right Side Fog Lamp', val: i?.fogLamps },
  { label: 'Power Window All Buttons', val: i?.powerWindows },
  { label: 'Music System', val: i?.musicSystem },
  { label: 'Steering Mounted Controls', val: i?.steeringMountedControls },
  { label: 'Wiper Washer Front', val: i?.wiper },
  { label: 'Rear Defogger', val: i?.rearDefogger },
  { label: 'Rear Wiper Washer', val: i?.rearWasher },
  { label: 'Instrument Cluster', val: i?.instrumentCluster },
  { label: 'Infotainment System', val: i?.infotainment },
  { label: 'Central Lock', val: i?.centralLock },
  { label: 'All Sensors', val: i?.sensors },
];

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(url);

export const InspectorVehicleDetailScreen: React.FC<InspectorVehicleDetailScreenProps> = ({ navigation, route }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const inspectionId = route?.params?.inspectionId;

  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectorService.getInspectionDetails(inspectionId);
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

  const handleDownloadPdf = async () => {
    if (!inspectionId) return;
    setDownloading(true);
    try {
      await inspectorService.downloadPdf(Number(inspectionId));
    } catch {
      // silent download
    } finally {
      setDownloading(false);
    }
  };

  const status = (previewData?.status || '').toUpperCase();
  const vehicleDetails = previewData?.vehicleDetails;
  const { imageMap, checklistImageMap } = useMemo(() => {
    const iMap: Record<string, string> = {};
    const cMap: Record<string, string> = {};

    // 1. Exterior panels from exteriorPanelDetails
    if (previewData?.exteriorPanelDetails && Array.isArray(previewData.exteriorPanelDetails)) {
      previewData.exteriorPanelDetails.forEach((p: any) => {
        if (p?.panelName && p?.imageUrl && !isVideoUrl(p.imageUrl)) {
          cMap[p.panelName.trim()] = p.imageUrl;
        }
      });
    }

    // 2. Inspection photos
    if (previewData?.inspectionPhotos && Array.isArray(previewData.inspectionPhotos)) {
      previewData.inspectionPhotos.forEach((img: any) => {
        const rawUrl = img?.imageUrl || img?.url;
        if (!rawUrl || isVideoUrl(rawUrl)) return;

        const pType = (img.photoType || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const pCat = (img.imageCategory || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const pDisp = (img.displayName || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

        let matchedSlotKey: string | undefined;
        for (const [slotKey, aliases] of Object.entries(slotPhotoTypeMap)) {
          const cleanAliases = aliases.map((a) => a.toUpperCase().replace(/[^A-Z0-9]/g, ''));
          if (cleanAliases.some((a) => (pType && pType === a) || (pCat && pCat === a) || (pDisp && pDisp === a))) {
            matchedSlotKey = slotKey;
            break;
          }
        }

        if (matchedSlotKey) {
          if (!iMap[matchedSlotKey]) {
            iMap[matchedSlotKey] = rawUrl;
          }
        } else {
          const rawName = (img.displayName || img.imageCategory || '').trim();
          const cleanName = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const isSectionName = ['INTERIOR', 'EXTERIOR', 'MECHANICAL', 'TYRE', 'TYRES', 'ELECTRICAL'].includes(cleanName);
          if (rawName && !isSectionName) {
            cMap[rawName] = rawUrl;
          }
        }
      });
    }

    // 3. Videos strictly for Engine / Motor Noise
    const inspectionVideos = previewData?.inspectionVideos || [];
    const noiseVid = inspectionVideos.find((v: any) => {
      if (!v) return false;
      const url = v.videoUrl || v.url || v.imageUrl;
      if (!url) return false;
      const disp = (v.displayName || v.videoType || v.imageCategory || '').toUpperCase();
      return disp.includes('NOISE') || disp.includes('ENGINE / MOTOR NOISE');
    });
    if (noiseVid) {
      cMap['Engine / Motor Noise'] = noiseVid.videoUrl || noiseVid.url || noiseVid.imageUrl;
    } else {
      const photos = previewData?.inspectionPhotos || [];
      const photoVid = photos.find((p: any) => {
        if (!p) return false;
        const url = p.imageUrl || p.videoUrl || p.url;
        if (!url) return false;
        const disp = (p.displayName || p.imageCategory || p.photoType || '').toUpperCase();
        const isNoise = disp.includes('NOISE') || disp.includes('ENGINE / MOTOR NOISE');
        return isNoise && (p.videoUrl || (url && isVideoUrl(url)));
      });
      if (photoVid) {
        cMap['Engine / Motor Noise'] = photoVid.imageUrl || photoVid.videoUrl || photoVid.url;
      }
    }

    return { imageMap: iMap, checklistImageMap: cMap };
  }, [previewData]);

  const getChecklistPhoto = (label: string): string | null => {
    if (!label) return null;
    const direct = checklistImageMap[label] || checklistImageMap[label.trim()];
    if (direct) return direct;

    const clean = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = Object.keys(checklistImageMap).find((k) => {
      const kClean = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return kClean === clean;
    });
    return foundKey ? checklistImageMap[foundKey] : null;
  };

  const renderMedia = (url: string | null | undefined, label: string, showEmpty = false) => {
    const resolved = resolveMediaUrl(url);
    const isNoise = label.toLowerCase().includes('noise');
    const isVideo = resolved ? isVideoUrl(resolved) : false;

    if (!resolved || (!isNoise && isVideo)) {
      if (!showEmpty) return null;
      return (
        <View style={[styles.mediaEmpty, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
          {isNoise ? <VideoIcon size={16} color={colors.mutedForeground} /> : <Camera size={16} color={colors.mutedForeground} />}
          <Text style={[styles.mediaEmptyText, { color: colors.mutedForeground }]}>
            {isNoise ? 'No video attached' : 'No photo attached'}
          </Text>
        </View>
      );
    }

    // ONLY the Noise item can render the Video player
    if (isNoise && isVideoUrl(resolved)) {
      return (
        <View style={[styles.mediaBox, { backgroundColor: '#000', overflow: 'hidden' }]}>
          <Video
            source={{ uri: resolved }}
            style={{ width: '100%', height: '100%' }}
            controls={true}
            resizeMode="contain"
            paused={false}
            muted={true}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.mediaBox} onPress={() => setLightbox(resolved)} activeOpacity={0.9}>
        <Image source={{ uri: resolved }} style={styles.mediaImage} resizeMode="cover" />
        <View style={styles.mediaOverlay}>
          <Eye size={14} color="#FFC700" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSpecGrid = (rows: { label: string; value: any; gold?: boolean }[]) => (
    <View style={styles.specGrid}>
      {rows.map((r, idx) => (
        <View key={idx} style={[styles.specCell, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
          <Text style={[styles.specCellLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
          <Text
            numberOfLines={2}
            style={[
              styles.specCellValue,
              r.gold ? styles.specCellValueGold : { color: colors.foreground },
            ]}
          >
            {r.value || 'N/A'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRating = (rating?: number, fallback = 4) => {
    const r = Math.round(rating ?? fallback);
    return (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            color={star <= r ? '#FFC700' : colors.border}
            fill={star <= r ? '#FFC700' : 'transparent'}
          />
        ))}
        <Text style={[styles.ratingText, { color: colors.foreground }]}>{r} / 5 Stars</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {vehicleDetails?.brand && vehicleDetails?.model
              ? `${vehicleDetails.brand} ${vehicleDetails.model} Inspection Detail`
              : `Inspection #${inspectionId}`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDownloadPdf} disabled={downloading} style={styles.headerIconBtn}>
            {downloading ? (
              <ActivityIndicator size="small" color="#FFC700" />
            ) : (
              <Download size={18} color="#FFC700" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentBody}>
          {loading ? (
            <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 60 }} />
          ) : !previewData ? (
            <View style={[styles.failCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <Text style={[styles.failText, { color: colors.mutedForeground }]}>Failed to load inspection details.</Text>
            </View>
          ) : (
            <>
              {/* Title card */}
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
                        <View style={[styles.statusPill, { backgroundColor: statusBg(status) }]}>
                          <Text style={[styles.statusPillText, { color: statusColor(status) }]}>{status}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.titleSub, { color: colors.mutedForeground }]}>
                      Inspection Report • Submitted on {previewData?.submittedAt ? formatDate(previewData.submittedAt) : 'Draft'}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.titleActions}>
                  <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf} disabled={downloading} activeOpacity={0.85}>
                    {downloading ? (
                      <ActivityIndicator size="small" color="#0D0E12" />
                    ) : (
                      <>
                        <Download size={14} color="#0D0E12" />
                        <Text style={styles.pdfBtnText}>Download PDF Report</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}
                    onPress={() => navigation.navigate('InspectorAddVehicle', { inspectionId })}
                    activeOpacity={0.85}
                  >
                    <Edit3 size={14} color="#FFC700" />
                    <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit & Update</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rejected banner */}
              {status === 'REJECTED' && (
                <View style={styles.rejectBanner}>
                  <AlertCircle size={18} color="#F43F5E" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectBannerTitle}>Report Rejected by Admin</Text>
                    <Text style={styles.rejectBannerDesc}>
                      Reason: {previewData?.rejectionReason || 'Please verify details.'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Step stepper */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsRow}>
                {detailSteps.map((s, idx) => {
                  const isActive = idx === activeStep;
                  const isDone = idx < activeStep;
                  return (
                    <TouchableOpacity
                      key={s.title}
                      onPress={() => setActiveStep(idx)}
                      style={[
                        styles.stepCard,
                        isActive
                          ? { borderColor: '#FFC700', backgroundColor: cardBg }
                          : { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' },
                      ]}
                      activeOpacity={0.85}
                    >
                      <View style={styles.stepHeader}>
                        <View
                          style={[
                            styles.stepBadge,
                            isActive
                              ? { backgroundColor: '#FFC700' }
                              : isDone
                                ? { backgroundColor: 'rgba(255,199,0,0.2)' }
                                : { backgroundColor: 'rgba(148,163,184,0.15)' },
                          ]}
                        >
                          {isDone ? (
                            <CheckCircle2 size={12} color="#FFC700" />
                          ) : (
                            <Text style={[styles.stepBadgeText, { color: isActive ? '#0D0E12' : isDone ? '#FFC700' : colors.mutedForeground }]}>
                              {idx + 1}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
                      </View>
                      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {s.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Step 1: Vehicle Specs */}
              {activeStep === 0 && (
                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 1: Vehicle Specs & Registration</Text>
                  <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                    Owner details, car registration, manufacturing year, and valuation.
                  </Text>
                  <View style={styles.panelBody}>
                    {renderSpecGrid([
                      { label: 'Customer Name', value: vehicleDetails?.customerName },
                      { label: 'Customer Mobile', value: vehicleDetails?.customerMobileNumber },
                      { label: 'Owner Profile Status', value: vehicleDetails?.ownerName || '1st Owner' },
                      { label: 'Registration Number', value: vehicleDetails?.vehicleNumber, gold: true },
                      { label: 'Make & Model', value: `${vehicleDetails?.brand} ${vehicleDetails?.model} ${vehicleDetails?.variant}` },
                      { label: 'Manufacturing Year', value: vehicleDetails?.manufacturingYear },
                      { label: 'Registration Year', value: vehicleDetails?.registrationYear || 'N/A' },
                      { label: 'Fuel Type & Transmission', value: `${vehicleDetails?.fuelType} / ${vehicleDetails?.transmission}` },
                      { label: 'Odometer Reading', value: vehicleDetails?.odometerReading ? `${vehicleDetails.odometerReading} km` : 'N/A' },
                      { label: 'Insurance Status', value: vehicleDetails?.insuranceStatus },
                      { label: 'Location', value: vehicleDetails?.location || 'N/A' },
                      { label: 'RTO Information', value: vehicleDetails?.rtoInformation || vehicleDetails?.rto || 'N/A' },
                      { label: 'RS Availability', value: vehicleDetails?.rsAvailability || vehicleDetails?.roadsideAssistance || 'N/A' },
                      { label: 'Duplicate Key', value: vehicleDetails?.duplicateKey || 'N/A' },
                      { label: 'RTO NOC Issued', value: vehicleDetails?.rtoNocIssued || vehicleDetails?.rtoNoc || 'N/A' },
                      { label: 'Under Hypothecation', value: vehicleDetails?.underHypothecation || vehicleDetails?.hypothecation || 'N/A' },
                      { label: 'Mismatch in RC', value: vehicleDetails?.mismatchInRc || vehicleDetails?.rcMismatch || 'N/A' },
                      { label: 'Road Tax Paid', value: vehicleDetails?.roadTaxPaid || vehicleDetails?.roadTax || 'N/A' },
                      { label: 'Fitness Valid Upto', value: vehicleDetails?.fitnessUpto || vehicleDetails?.fitnessDate || 'N/A' },
                      { label: 'Suggested Price Valuation', value: vehicleDetails?.suggestedPrice ? inr(vehicleDetails.suggestedPrice) : 'N/A', gold: true },
                    ])}
                  </View>
                </View>
              )}

              {/* Step 2: Exterior */}
              {activeStep === 1 && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <View style={styles.panelTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 2: Exterior Panels Evaluation</Text>
                        <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                          Review each body panel for scratches, dents, repainting or structural damages.
                        </Text>
                      </View>
                      {renderRating(previewData?.ratings?.exterior, 5)}
                    </View>
                    <View style={styles.panelBody}>
                      <View style={styles.grid2}>
                        {sortExteriorPanels(previewData?.exteriorPanelDetails || []).map((p: any, idx: number) => {
                          const cond = (p.condition || 'OK').toUpperCase();
                          const isNa = cond === 'NA' || cond === 'N/A';
                          const cc = panelConditionColors[cond] || panelConditionColors.OK;
                          return (
                            <View key={idx} style={[styles.itemCard, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                              <View style={styles.itemHeader}>
                                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                                  {p.panelName}
                                </Text>
                                <View style={[styles.condPill, { backgroundColor: cc.bg }]}>
                                  <Text style={[styles.condPillText, { color: cc.color }]}>{cond}</Text>
                                </View>
                              </View>
                              {!isNa && renderMedia(p.imageUrl || getChecklistPhoto(p.panelName), p.panelName)}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Mandatory Exterior Images</Text>
                    <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                      Upload clean, high-resolution photos of five primary panels.
                    </Text>
                    <View style={styles.panelBody}>
                      <View style={styles.photoGrid}>
                        {imageSlotsConfig.filter((slot) => slot.step === 1).map((slot) => (
                          <View key={slot.key} style={[styles.photoCard, { borderColor: colors.border }]}>
                            <Text style={[styles.photoLabel, { color: colors.foreground }]} numberOfLines={1}>
                              {slot.label}
                            </Text>
                            {renderMedia(imageMap[slot.key], slot.label, true)}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 3: Mechanical */}
              {activeStep === 2 && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <View style={styles.panelTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 3: Mechanical Health Diagnostics</Text>
                        <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                          Check items inside engine compartment, transmission bay and brake assemblies.
                        </Text>
                      </View>
                      {renderRating(previewData?.ratings?.mechanical, 5)}
                    </View>
                    <View style={styles.panelBody}>
                      <View style={styles.grid2}>
                        {mechanicalLabels.map((item, idx) => {
                          const val = (previewData?.mechanicalDetails?.[item.key] || 'OK').toUpperCase().trim();
                          const isNa = val === 'NA' || val === 'N/A' || val === 'NOT APPLICABLE';
                          const isNoise = item.label.toLowerCase().includes('noise');
                          return (
                            <View key={idx} style={[styles.itemCard, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                              <View style={styles.itemHeader}>
                                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                                  {item.label}
                                </Text>
                                <View style={[styles.valPill, { borderColor: colors.border, backgroundColor: isDark ? '#12141C' : '#FFFFFF' }]}>
                                  <Text style={[styles.valPillText, { color: colors.foreground }]}>
                                    {previewData?.mechanicalDetails?.[item.key] || 'OK'}
                                  </Text>
                                </View>
                              </View>
                              {!isNa && renderMedia(getChecklistPhoto(item.label), item.label, isNoise)}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Under-Bonnet Engine Room Photos</Text>
                    <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                      Clear views of motor cylinders, fluid caps, and battery mounts.
                    </Text>
                    <View style={styles.panelBody}>
                      <View style={styles.photoGrid}>
                        {imageSlotsConfig.filter((slot) => slot.step === 2).map((slot) => (
                          <View key={slot.key} style={[styles.photoCard, { borderColor: colors.border }]}>
                            <Text style={[styles.photoLabel, { color: colors.foreground }]} numberOfLines={1}>
                              {slot.label}
                            </Text>
                            {renderMedia(imageMap[slot.key], slot.label, true)}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 4: Tyres */}
              {activeStep === 3 && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <View style={styles.panelTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 4: Tyres Specifications</Text>
                        <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                          Enter remaining tread depth percentage and brand names for all wheels.
                        </Text>
                      </View>
                      {renderRating(previewData?.ratings?.tyre, 4)}
                    </View>
                    <View style={styles.panelBody}>
                      {tyreItems(previewData?.tyreDetails).map((t, idx) => (
                        <View key={idx} style={[styles.tyreCard, { borderColor: colors.border }]}>
                          <View style={styles.tyreTopRow}>
                            <Text style={[styles.tyreName, { color: colors.foreground }]}>{t.label}</Text>
                            <View style={styles.treadPill}>
                              <Text style={styles.treadPillText}>Tread: {t.tread ? `${t.tread}%` : '60%'}</Text>
                            </View>
                          </View>
                          <View style={styles.tyreBottomRow}>
                            <Text style={[styles.tyreBrandLabel, { color: colors.mutedForeground }]}>Brand & Model:</Text>
                            <Text style={[styles.tyreBrandValue, { color: colors.foreground }]}>{t.brand || 'JK 2019'}</Text>
                          </View>
                        </View>
                      ))}

                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Emergency Toolkit Checklist</Text>
                      <View style={styles.grid2}>
                        {emergencyItems(previewData?.tyreDetails).map((eq, idx) => (
                          <View key={idx} style={[styles.toolkitCard, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                            <Text style={[styles.toolkitName, { color: colors.foreground }]}>{eq.name}</Text>
                            <View style={[styles.toolkitPill, { backgroundColor: eq.present ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)' }]}>
                              <Text style={[styles.toolkitPillText, { color: eq.present ? '#10B981' : '#F43F5E' }]}>
                                {eq.present ? 'Available' : 'Missing'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Individual Tyre Profile Images</Text>
                    <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                      Upload tread close-ups for all 4 positions and spare wheel.
                    </Text>
                    <View style={styles.panelBody}>
                      <View style={styles.photoGrid}>
                        {imageSlotsConfig.filter((slot) => slot.step === 3).map((slot) => (
                          <View key={slot.key} style={[styles.photoCard, { borderColor: colors.border }]}>
                            <Text style={[styles.photoLabel, { color: colors.foreground }]} numberOfLines={1}>
                              {slot.label}
                            </Text>
                            {renderMedia(imageMap[slot.key], slot.label, true)}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 5: Interior */}
              {activeStep === 4 && (
                <View style={{ gap: 14 }}>
                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Cabin & Electrical Components</Text>
                    <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                      Upload odometer and AC control photo slots.
                    </Text>
                    <View style={styles.panelBody}>
                      <View style={styles.photoGrid}>
                        {imageSlotsConfig.filter((slot) => slot.step === 4).map((slot) => (
                          <View key={slot.key} style={[styles.photoCard, { borderColor: colors.border }]}>
                            <Text style={[styles.photoLabel, { color: colors.foreground }]} numberOfLines={1}>
                              {slot.label}
                            </Text>
                            {renderMedia(imageMap[slot.key], slot.label, true)}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <View style={styles.panelTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Interior & Electrical Diagnostics</Text>
                        <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                          Parameters from Electrical & Interior Report.
                        </Text>
                      </View>
                      {renderRating(previewData?.ratings?.interior, 4)}
                    </View>
                    <View style={styles.panelBody}>
                      <View style={styles.topSpecsRow}>
                        <View style={[styles.topSpec, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                          <Text style={[styles.topSpecLabel, { color: colors.mutedForeground }]}>Battery Company</Text>
                          <Text style={[styles.topSpecValue, { color: colors.foreground }]}>
                            {previewData?.interiorDetails?.batteryBrand || 'N/A'}
                          </Text>
                        </View>
                        <View style={[styles.topSpec, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                          <Text style={[styles.topSpecLabel, { color: colors.mutedForeground }]}>Full Battery Serial Number</Text>
                          <Text style={[styles.topSpecValue, { color: colors.foreground }]} numberOfLines={1}>
                            {previewData?.interiorDetails?.batterySerialNumber || 'N/A'}
                          </Text>
                        </View>
                        <View style={[styles.topSpec, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                          <Text style={[styles.topSpecLabel, { color: colors.mutedForeground }]}>AC Cooling Performance</Text>
                          <Text style={[styles.topSpecValue, { color: colors.foreground }]}>
                            {previewData?.interiorDetails?.acCooling || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.grid2}>
                        {electricalItems(previewData?.interiorDetails).map((item, idx) => {
                          const val = (item.val || 'OK / WORKING').toUpperCase().trim();
                          const isNa = val === 'NA' || val === 'N/A' || val === 'NOT APPLICABLE';
                          return (
                            <View key={idx} style={[styles.itemCard, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                              <View style={styles.itemHeader}>
                                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                                  {item.label}
                                </Text>
                                <View style={[styles.valPill, { borderColor: colors.border, backgroundColor: isDark ? '#12141C' : '#FFFFFF' }]}>
                                  <Text style={[styles.valPillText, { color: colors.foreground }]}>{item.val || 'OK / WORKING'}</Text>
                                </View>
                              </View>
                              {!isNa && renderMedia(getChecklistPhoto(item.label), item.label)}
                            </View>
                          );
                        })}
                      </View>

                      <View style={styles.remarksBlock}>
                        <Text style={[styles.remarksLabel, { color: colors.foreground }]}>Inspector Remarks & Notes</Text>
                        <View style={[styles.remarksBox, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                          <Text style={[styles.remarksText, { color: colors.foreground }]}>
                            {previewData?.interiorDetails?.remarks || 'No remarks entered.'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Stepper navigation */}
              <View style={[styles.stepNav, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.prevBtn, { borderColor: colors.border, backgroundColor: cardBg }]}
                  disabled={activeStep === 0}
                  onPress={() => setActiveStep((s) => Math.max(0, s - 1))}
                  activeOpacity={0.85}
                >
                  <ChevronLeft size={16} color={colors.foreground} />
                  <Text style={[styles.prevBtnText, { color: colors.foreground }]}>Previous Step</Text>
                </TouchableOpacity>

                {activeStep < detailSteps.length - 1 ? (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => setActiveStep((s) => s + 1)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextBtnText}>Continue Next Step</Text>
                    <ChevronRight size={16} color="#0D0E12" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => navigation.navigate('InspectorAddVehicle', { inspectionId })}
                    activeOpacity={0.85}
                  >
                    <Edit3 size={14} color="#0D0E12" />
                    <Text style={styles.nextBtnText}>Edit & Update Vehicle</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Image lightbox */}
      <Modal transparent visible={lightbox !== null} animationType="fade" onRequestClose={() => setLightbox(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightbox(null)} activeOpacity={0.8}>
            <Text style={styles.lightboxCloseText}>Close</Text>
          </TouchableOpacity>
          {lightbox && <Image source={{ uri: lightbox }} style={styles.lightboxImage} resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const statusColor = (s: string) => {
  if (s === 'APPROVED') return '#10B981';
  if (s === 'REJECTED') return '#F43F5E';
  if (s === 'SUBMITTED') return '#FFC700';
  return '#94A3B8';
};
const statusBg = (s: string) => {
  if (s === 'APPROVED') return 'rgba(16,185,129,0.12)';
  if (s === 'REJECTED') return 'rgba(244,63,94,0.12)';
  if (s === 'SUBMITTED') return 'rgba(255,199,0,0.12)';
  return 'rgba(148,163,184,0.12)';
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
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentBody: {
    padding: 16,
    gap: 14,
  },
  failCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  failText: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleName: {
    fontSize: 17,
    fontWeight: '900',
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },
  regPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  regPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 8,
  },
  titleActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingVertical: 12,
  },
  pdfBtnText: {
    color: '#0D0E12',
    fontSize: 11.5,
    fontWeight: '900',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  rejectBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    borderRadius: 16,
    padding: 14,
  },
  rejectBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F43F5E',
  },
  rejectBannerDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F43F5E',
    marginTop: 3,
    lineHeight: 15,
  },
  stepsRow: {
    gap: 10,
    paddingBottom: 2,
  },
  stepCard: {
    width: 160,
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    flexShrink: 1,
  },
  stepSubtitle: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 6,
  },
  panelCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  panelDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  panelBody: {
    marginTop: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 9.5,
    fontWeight: '800',
    marginLeft: 5,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specCell: {
    width: '100%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  specCellLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  specCellValue: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 4,
  },
  specCellValueGold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFC700',
    marginTop: 4,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemCard: {
    width: '100%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemName: {
    fontSize: 10.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  condPill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  condPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  valPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  valPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  mediaBox: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 7,
    padding: 5,
  },
  mediaEmpty: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  mediaEmptyText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  videoPlaceholderText: {
    color: '#FFC700',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 34,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  photoCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  tyreCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  tyreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(148,163,184,0.3)',
    paddingBottom: 8,
  },
  tyreName: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  treadPill: {
    backgroundColor: 'rgba(255,199,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  treadPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFC700',
  },
  tyreBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tyreBrandLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tyreBrandValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 10,
  },
  toolkitCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolkitName: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  toolkitPill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  toolkitPillText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  topSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  topSpec: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  topSpecLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  topSpecValue: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 4,
  },
  remarksBlock: {
    marginTop: 12,
  },
  remarksLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  remarksBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },
  remarksText: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  stepNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  prevBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  nextBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0D0E12',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 5,
    backgroundColor: 'rgba(255,199,0,0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  lightboxCloseText: {
    color: '#0D0E12',
    fontSize: 12,
    fontWeight: '900',
  },
  lightboxImage: {
    width: '100%',
    height: '80%',
  },
});
