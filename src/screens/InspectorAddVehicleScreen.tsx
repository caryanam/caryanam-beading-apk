import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Camera,
  Star,
  Trash2,
  ShieldCheck,
  Video,
  X,
  Calendar,
  ChevronLeft,
} from 'lucide-react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNVideo from 'react-native-video';
import { inspectorService, resolveMediaUrl } from '../services/inspectorService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface InspectorAddVehicleScreenProps {
  navigation: any;
  route: any;
  onOpenMenu: () => void;
}

/* ── Static configuration (mirrors web AddVehicle.tsx) ── */

const steps = [
  { title: 'Vehicle Specs', subtitle: 'Registration & owner details' },
  { title: 'Exterior Body', subtitle: '32-point panel & side photos' },
  { title: 'Mechanical', subtitle: 'Engine, oil & motor bay photos' },
  { title: 'Tyres & Emergency', subtitle: 'Tyre tread & wheel photos' },
  { title: 'Interior & Media', subtitle: 'Odometer & PDF report' },
];

const exteriorPanels = [
  'Right Side Fender',
  'Right Side Front Door',
  'Right Side Rear Door',
  'Right Side Quarter Panel Window',
  'Right Side A Pillar',
  'Right Side B Pillar',
  'Right Side C Pillar',
  'Right Side Running Board',
  'Trunk Door (Dicky)',
  'Rear Bumper',
  'Left Side Rear Door',
  'Left Side Front Door',
  'Left Side Running Board',
  'Left Side Quarter Panel',
  'Left Side A Pillar',
  'Left Side B Pillar',
  'Left Side C Pillar',
  'Left Side Fender',
  'Right Side Mirror',
  'Left Side Mirror',
  'Front Bonnet Hood',
  'Front Bumper',
  'Front Wind Shield',
  'Rear Wind Shield',
  'Roof Top',
  'Chassis Embossing',
  'VIN Plate',
  'Under Body Damages',
  'Right Side Quarter Panel',
  'Right Side Front Window',
  'Left Side Quarter Panel Window',
];

const panelConditions = ['OK', 'DAMAGED', 'REPAINTED', 'CHANGED', 'SCRATCH', 'DENT', 'RUST', 'NA'];

const mechanicalItems: { name: string; type: string; options?: string[]; default?: string }[] = [
  { name: 'Engine / Motor Status', type: 'status' },
  { name: 'Engine Oil', type: 'fluid', options: ['OK', 'NOT OK', 'NEED CHANGE'] },
  { name: 'Brakes Oil', type: 'fluid', options: ['SATISFACTORY', 'NEED REPLACEMENT', 'NOT OK'] },
  { name: 'Steering Oil', type: 'fluid', options: ['OK', 'NEED REPLACEMENT'] },
  { name: 'Coolant', type: 'fluid', options: ['OK', 'NEED TO REPLACED', 'LOW'] },
  { name: 'Brakes Booster', type: 'status' },
  { name: 'Apron Condition', type: 'status' },
  { name: 'Chassis Alignment', type: 'status' },
  { name: 'Brakes Working', type: 'status' },
  { name: 'Suspension', type: 'status' },
  { name: 'Suspension Bushing', type: 'status' },
  { name: 'Oil Leakage', type: 'status' },
  { name: 'Exhaust Smoke Color', type: 'text', default: 'COLOURLESS' },
  { name: 'Manual Transmission Fluid Level', type: 'status' },
  { name: 'Differential Fluid Level', type: 'status' },
  { name: 'Fluid Leakages', type: 'text', default: 'NO LEAKAGE' },
  { name: 'Steering Gearbox & Linkage', type: 'status' },
  { name: 'Driveline / Axle', type: 'status' },
  { name: 'Engine / Motor Noise', type: 'text', default: 'NORMAL' },
];

const tyrePositions = [
  { id: 'frontRight', label: 'Front Right Tyre', defaultBrand: 'JK 2019' },
  { id: 'rearRight', label: 'Rear Right Tyre', defaultBrand: 'JK 2019' },
  { id: 'rearLeft', label: 'Rear Left Tyre', defaultBrand: 'JK 2019' },
  { id: 'frontLeft', label: 'Front Left Tyre', defaultBrand: 'JK 2019' },
  { id: 'spareWheel', label: 'Spare Tyre', defaultBrand: 'Bridgestone 2015' },
];

const emergencyItems = ['Jack', 'Handle', 'Tool Kit', 'First Aid Box', 'Emergency Triangle'];

const electricalItems = [
  'Right Side Tail Lamp',
  'Left Side Tail Lamp',
  'Right Side Head Light',
  'Left Side Head Light',
  'Right Indicator',
  'Left Indicator',
  'Boot Floor',
  'Washer Fluid',
  'Dashboard',
  'Left Side Fog Lamp',
  'Right Side Fog Lamp',
  'Rear Stop Light',
  'Power Window All Buttons',
  'Music System',
  'Adjustable Steering',
  'Steering Mounted Controls',
  'Wiper Washer Front',
  'Rear Defogger',
  'Rear Wiper Washer',
  'Instrument Cluster',
  'Infotainment System',
  'Central Lock',
  'Push Start Button',
  'Sunroof',
  'All Sensors',
];

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

const imageSlotsConfig = [
  { key: 'frontSide', label: 'FRONT SIDE IMAGE', step: 1 },
  { key: 'rightSide', label: 'RIGHT SIDE IMAGE', step: 1 },
  { key: 'rearSide', label: 'REAR SIDE IMAGE', step: 1 },
  { key: 'leftSide', label: 'LEFT SIDE IMAGE', step: 1 },
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

const mapCondition = (cond: string): string => {
  if (!cond) return 'NA';
  const c = cond.toUpperCase().trim();
  if (['NO DAMAGES', 'OK', 'OK / WORKING', 'WORKING', 'SATISFACTORY'].includes(c)) return 'OK';
  if (c === 'DAMAGED') return 'DAMAGED';
  if (c === 'REPAINTED') return 'REPAINTED';
  if (c === 'CHANGED') return 'CHANGED';
  if (c === 'SCRATCH' || c === 'SCRATCHES') return 'SCRATCH';
  if (c === 'DENT' || c === 'DENTS') return 'DENT';
  if (c === 'RUST' || c === 'RUSTED') return 'RUST';
  return 'NA';
};

const isValidRegNo = (regNo: string): boolean => {
  if (!regNo) return false;
  const clean = regNo.replace(/\s+/g, '').toUpperCase();
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  const isPureNumeric = /^\d+$/.test(clean);
  const isPureAlpha = /^[A-Z]+$/.test(clean);
  if (isPureNumeric || isPureAlpha) return false;
  return (standardPattern.test(clean) || bhPattern.test(clean)) && clean.length >= 6 && clean.length <= 12;
};

const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(String);

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(url);

/* ── Reusable sub-components ── */

interface PickerFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  error?: string;
  onChange: (val: string) => void;
  colors: any;
  isDark: boolean;
}

const PickerField: React.FC<PickerFieldProps> = ({ label, value, options, placeholder, error, onChange, colors, isDark }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.field,
          { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.fieldValue, value ? { color: colors.foreground } : { color: colors.mutedForeground }]}>
          {value || placeholder || 'Select'}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: isDark ? '#12141C' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerOption, active && { backgroundColor: 'rgba(255,199,0,0.12)' }]}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pickerOptionText, { color: active ? '#FFC700' : colors.foreground }]}>{opt}</Text>
                    {active && <CheckCircle2 size={15} color="#FFC700" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  keyboardType?: any;
  maxLength?: number;
  uppercase?: boolean;
  numericOnly?: boolean;
  multiline?: boolean;
  onChange: (val: string) => void;
  colors: any;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  placeholder,
  error,
  keyboardType,
  maxLength,
  uppercase,
  numericOnly,
  multiline,
  onChange,
  colors,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
    <TextInput
      style={[
        styles.field,
        multiline && styles.fieldMultiline,
        { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: colors.card, color: colors.foreground },
      ]}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType}
      maxLength={maxLength}
      multiline={multiline}
      autoCapitalize={uppercase ? 'characters' : 'none'}
      autoCorrect={false}
      onChangeText={(t) => {
        let v = t;
        if (numericOnly) {
          v = t.replace(/[^0-9.]/g, '');
        } else if (uppercase) {
          v = t.toUpperCase();
        }
        onChange(v);
      }}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  colors: any;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, colors }) => (
  <View style={styles.ratingRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
        <Star
          size={20}
          color={star <= value ? '#FFC700' : colors.border}
          fill={star <= value ? '#FFC700' : 'transparent'}
        />
      </TouchableOpacity>
    ))}
    <Text style={[styles.ratingText, { color: colors.foreground }]}>{value} / 5 Stars</Text>
  </View>
);

interface PhotoSlotProps {
  label: string;
  value?: string;
  error?: string;
  isVideo?: boolean;
  uploading?: boolean;
  onPick: () => void;
  onRemove: () => void;
  colors: any;
  isDark: boolean;
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ label, value, error, isVideo, uploading, onPick, onRemove, colors, isDark: _isDark }) => {
  const resolved = resolveMediaUrl(value);
  const isVideoItem = !!isVideo;
  const isMediaVideo = resolved ? isVideoUrl(resolved) : false;
  // Photo slots strictly require an image and must NEVER display a video.
  const hasValidMedia = !!resolved && (isVideoItem ? isMediaVideo : !isMediaVideo);

  return (
    <View style={styles.photoSlotWrap}>
      <View style={styles.photoSlotHeader}>
        <Text style={[styles.photoSlotLabel, { color: colors.foreground }]} numberOfLines={1}>
          {label}
        </Text>
        {hasValidMedia ? (
          <View style={styles.capturedPill}>
            <CheckCircle2 size={10} color="#10B981" />
            <Text style={styles.capturedPillText}>Captured</Text>
          </View>
        ) : (
          <View style={styles.requiredPill}>
            <AlertCircle size={10} color="#F59E0B" />
            <Text style={styles.requiredPillText}>Required</Text>
          </View>
        )}
      </View>

      {hasValidMedia && resolved ? (
        <View style={[styles.photoPreview, { borderColor: colors.border }]}>
          {isVideoItem ? (
            <RNVideo
              source={{ uri: resolved }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              controls={true}
              paused={true}
            />
          ) : (
            <Image source={{ uri: resolved }} style={styles.photoPreviewImg} resizeMode="cover" />
          )}
          <View style={styles.photoPreviewActions}>
            <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemove} activeOpacity={0.85}>
              <Trash2 size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBox, { borderColor: error ? '#F43F5E' : colors.border }]}
          onPress={onPick}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color="#FFC700" size="small" />
          ) : (
            <>
              {isVideoItem ? <Video size={22} color="#FFC700" /> : <Camera size={22} color="#FFC700" />}
              <Text style={[styles.uploadBoxTitle, { color: colors.foreground }]}>
                {isVideoItem ? 'Upload Video' : 'Upload Photo'}
              </Text>
              <Text style={[styles.uploadBoxSub, { color: colors.mutedForeground }]}>Tap to browse</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
};

interface ChecklistItemProps {
  label: string;
  value: string;
  options: string[];
  image?: string;
  error?: string;
  isVideo?: boolean;
  uploading?: boolean;
  onValueChange: (val: string) => void;
  onPick: () => void;
  onRemove: () => void;
  colors: any;
  isDark: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  label,
  value,
  options,
  image,
  error,
  isVideo,
  uploading,
  onValueChange,
  onPick,
  onRemove,
  colors,
  isDark,
}) => {
  const resolved = resolveMediaUrl(image);
  const valUpper = (value || '').toUpperCase().trim();
  const isNa = valUpper === 'NA' || valUpper === 'N/A' || valUpper === 'NOT APPLICABLE';
  const isVideoItem = !!isVideo;
  const isMediaVideo = resolved ? isVideoUrl(resolved) : false;
  // If status is NA, NEVER display image. Checklist photo items strictly require an image and must NEVER display a video.
  const hasValidMedia = !isNa && !!resolved && (isVideoItem ? isMediaVideo : !isMediaVideo);

  return (
    <View style={[styles.checkItem, { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
      <View style={styles.checkItemRow}>
        <Text style={[styles.checkItemName, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PickerFieldMini
            value={value}
            options={options}
            onSelect={onValueChange}
            colors={colors}
          />
          {!hasValidMedia && !isNa && (
            <TouchableOpacity
              style={[
                styles.checkItemUploadMini,
                { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
              ]}
              onPress={onPick}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFC700" />
              ) : (
                isVideoItem ? <Video size={16} color="#FFC700" /> : <Camera size={16} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          )}
          {isNa && (
            <View style={styles.naTagMini}>
              <Text style={styles.naTagMiniText}>N/A</Text>
            </View>
          )}
        </View>
      </View>

      {hasValidMedia && resolved ? (
        <View style={[styles.checkItemPreview, { borderColor: colors.border, marginTop: 10 }]}>
          {isVideoItem ? (
            <RNVideo
              source={{ uri: resolved }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              controls={true}
              paused={true}
            />
          ) : (
            <Image source={{ uri: resolved }} style={styles.checkItemPreviewImg} resizeMode="cover" />
          )}
          <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemove} activeOpacity={0.85}>
            <Trash2 size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}
      
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
};

interface PickerFieldMiniProps {
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  colors: any;
}

const PickerFieldMini: React.FC<PickerFieldMiniProps> = ({ value, options, onSelect, colors }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={[styles.checkItemSelect, { borderColor: colors.border }]} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={[styles.checkItemSelectText, { color: colors.foreground }]} numberOfLines={1}>
          {value || 'OK'}
        </Text>
        <ChevronDown size={13} color={colors.mutedForeground} />
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{value}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerOption, opt === value && { backgroundColor: 'rgba(255,199,0,0.12)' }]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pickerOptionText, { color: opt === value ? '#FFC700' : colors.foreground }]}>{opt}</Text>
                  {opt === value && <CheckCircle2 size={15} color="#FFC700" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

interface DatePickerFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (val: string) => void;
  colors: any;
  isDark: boolean;
}

const parseDateStr = (str: string) => {
  if (!str) return new Date();
  const ddMMyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(str.trim());
  if (ddMMyyyy) {
    const [, d, m, y] = ddMMyyyy;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  placeholder,
  error,
  onChange,
  colors,
  isDark,
}) => {
  const [open, setOpen] = useState(false);
  const now = new Date();

  const initialDate = parseDateStr(value);
  const [currYear, setCurrYear] = useState(initialDate.getFullYear());
  const [currMonth, setCurrMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currYear, currMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currMonth === 0) {
      setCurrMonth(11);
      setCurrYear((y) => y - 1);
    } else {
      setCurrMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currMonth === 11) {
      setCurrMonth(0);
      setCurrYear((y) => y + 1);
    } else {
      setCurrMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const mStr = String(currMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${dStr}-${mStr}-${currYear}`;
    onChange(formatted);
    setOpen(false);
  };

  const formattedDisplay = value || '';

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.field,
          { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.fieldValue, formattedDisplay ? { color: colors.foreground } : { color: colors.mutedForeground }]}>
          {formattedDisplay || placeholder || 'DD-MM-YYYY'}
        </Text>
        <Calendar size={18} color="#FFC700" />
      </TouchableOpacity>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: isDark ? '#12141C' : '#FFFFFF', borderColor: colors.border, maxWidth: 350 }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>📅 {label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}>
              <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 7, borderRadius: 8, backgroundColor: isDark ? '#1F2430' : '#F0F2F6' }}>
                <ChevronLeft size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#FFC700' }}>
                {monthNames[currMonth]} {currYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 7, borderRadius: 8, backgroundColor: isDark ? '#1F2430' : '#F0F2F6' }}>
                <ChevronRight size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.mutedForeground }}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 36 }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const isSelected = selectedDay === d && initialDate.getMonth() === currMonth && initialDate.getFullYear() === currYear;
                return (
                  <TouchableOpacity
                    key={`day-${d}`}
                    style={{
                      width: `${100 / 7}%`,
                      height: 36,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => handleSelectDay(d)}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#FFC700' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: isSelected ? '900' : '600', color: isSelected ? '#0D0E12' : colors.foreground }}>
                        {d}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              {['1 Year', '2 Years', '5 Years'].map((preset) => {
                const addY = parseInt(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(255,199,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', alignItems: 'center' }}
                    onPress={() => {
                      const targetY = now.getFullYear() + addY;
                      const mStr = String(now.getMonth() + 1).padStart(2, '0');
                      const dStr = String(now.getDate()).padStart(2, '0');
                      onChange(`${dStr}-${mStr}-${targetY}`);
                      setOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FFC700' }}>+{preset}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ── Main screen ── */

export const InspectorAddVehicleScreen: React.FC<InspectorAddVehicleScreenProps> = ({ navigation, route }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  const routeId = route?.params?.inspectionId;
  const [step, setStep] = useState(0);
  const [inspectionId, setInspectionId] = useState<number | null>(routeId ? Number(routeId) : null);
  const [loading, setLoading] = useState(!!routeId);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [basicDetails, setBasicDetails] = useState({
    customerName: '',
    customerMobile: '',
    ownerName: '',
    brand: '',
    model: '',
    variant: '',
    fuel: '',
    transmission: '',
    year: '',
    regYear: '',
    regNo: '',
    odometer: '',
    insurance: '',
    evaluator: '',
    evalDate: new Date().toLocaleDateString('en-US'),
    location: '',
    rtoInformation: '',
    rsAvailability: '',
    duplicateKey: '',
    rtoNocIssued: '',
    underHypothecation: '',
    mismatchInRc: '',
    roadTaxPaid: '',
    fitnessUpto: '',
  });
  const [suggestedPrice, setSuggestedPrice] = useState('');

  const [exteriorState, setExteriorState] = useState<Record<string, string>>({});
  const [panelImages, setPanelImages] = useState<Record<string, string>>({});
  const [exteriorRating, setExteriorRating] = useState(4);

  const [mechanicalState, setMechanicalState] = useState<Record<string, string>>({});
  const [mechanicalRating, setMechanicalRating] = useState(5);

  const [tyreState, setTyreState] = useState<Record<string, { condition: number; brand: string }>>({
    frontRight: { condition: 60, brand: 'JK 2019' },
    rearRight: { condition: 60, brand: 'JK 2019' },
    rearLeft: { condition: 60, brand: 'JK 2019' },
    frontLeft: { condition: 60, brand: 'JK 2019' },
    spareWheel: { condition: 40, brand: 'Bridgestone 2015' },
  });
  const [tyreRating, setTyreRating] = useState(4);

  const [emergencyState, setEmergencyState] = useState<Record<string, boolean>>({
    Jack: true,
    Handle: true,
    'Tool Kit': true,
    'First Aid Box': false,
    'Emergency Triangle': false,
  });

  const [electricalState, setElectricalState] = useState<Record<string, string>>({
    'Battery Company': '',
    'Full Battery Number': '',
    AC: '',
  });
  const [electricalRating, setElectricalRating] = useState(4);
  const [comments, setComments] = useState('');
  const [partImages, setPartImages] = useState<Record<string, string>>({});

  /* ── Load existing draft ── */
  const loadInspectionData = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        const res = await inspectorService.getInspectionDetails(id);
        if (res.success && res.data) {
          const details = res.data;
          const v = details.vehicleDetails;
          if (v) {
            setBasicDetails({
              customerName: v.customerName || '',
              customerMobile: v.customerMobileNumber || '',
              ownerName: v.ownerName || '1st Owner',
              brand: v.brand || '',
              model: v.model || '',
              variant: v.variant || '',
              fuel: v.fuelType || 'Petrol',
              transmission: v.transmission || 'Manual (MT)',
              year: v.manufacturingYear ? v.manufacturingYear.toString() : '',
              regYear: v.registrationYear ? v.registrationYear.toString() : '',
              regNo: v.vehicleNumber || '',
              odometer: v.odometerReading ? v.odometerReading.toString() : '',
              insurance: v.insuranceStatus || '',
              evaluator: v.inspectorCode || '',
              evalDate: v.inspectionDate ? new Date(v.inspectionDate).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'),
              location: v.location || '',
              rtoInformation: v.rtoInformation || v.rto || '',
              rsAvailability: v.rsAvailability || v.roadsideAssistance || 'Available (Yes)',
              duplicateKey: v.duplicateKey || 'Yes',
              rtoNocIssued: v.rtoNocIssued || v.rtoNoc || 'No',
              underHypothecation: v.underHypothecation || v.hypothecation || 'No',
              mismatchInRc: v.mismatchInRc || v.rcMismatch || 'No Mismatch (Clean)',
              roadTaxPaid: v.roadTaxPaid || v.roadTax || 'Individual / One Time',
              fitnessUpto: v.fitnessUpto || v.fitnessDate || '',
            });
            setSuggestedPrice(v.suggestedPrice ? v.suggestedPrice.toLocaleString('en-IN') : '');
          }

          if (details.ratings) {
            const r = details.ratings;
            const ext = r.exterior ?? r.exteriorRating;
            const mech = r.mechanical ?? r.mechanicalRating;
            const tyr = r.tyre ?? r.tyreRating;
            const int = r.interior ?? r.interiorRating;
            if (ext != null) setExteriorRating(Math.round(ext));
            if (mech != null) setMechanicalRating(Math.round(mech));
            if (tyr != null) setTyreRating(Math.round(tyr));
            if (int != null) setElectricalRating(Math.round(int));
          }

          if (details.exteriorPanelDetails) {
            const panelMap: Record<string, string> = {};
            const pImageMap: Record<string, string> = {};
            details.exteriorPanelDetails.forEach((p: any) => {
              panelMap[p.panelName] = p.condition;
              if (p.imageUrl) pImageMap[p.panelName] = p.imageUrl;
            });
            setExteriorState(panelMap);
            setPanelImages((prev) => ({ ...prev, ...pImageMap }));
          }

          if (details.mechanicalDetails) {
            const mech = details.mechanicalDetails;
            setMechanicalState({
              'Engine / Motor Status': mech.engineStatus || 'OK',
              'Engine Oil': mech.engineOil || 'OK',
              'Brakes Oil': mech.brakeOil || 'SATISFACTORY',
              'Steering Oil': mech.steeringOil || 'OK',
              Coolant: mech.coolant || 'OK',
              'Brakes Booster': mech.brakeBooster || 'OK',
              'Brakes Working': mech.brakeWorking || 'OK',
              'Apron Condition': mech.apron || 'OK',
              'Chassis Alignment': mech.chassis || 'OK',
              Suspension: mech.suspension || 'OK',
              'Suspension Bushing': mech.bush || 'OK',
              'Oil Leakage': mech.leakage || 'OK',
              'Exhaust Smoke Color': mech.smoke || 'COLOURLESS',
              'Manual Transmission Fluid Level': mech.transmission || 'OK',
              'Differential Fluid Level': mech.differential || 'OK',
              'Fluid Leakages': mech.fluidLeakage || 'NO LEAKAGE',
              'Steering Gearbox & Linkage': mech.gearbox || 'OK',
              'Driveline / Axle': mech.axle || 'OK',
              'Engine / Motor Noise': mech.engineNoise || 'NORMAL',
            });
          }

          if (details.tyreDetails) {
            const t = details.tyreDetails;
            setTyreState({
              frontRight: { condition: t.frontRightTread || 60, brand: t.frontRightBrand || 'JK 2019' },
              rearRight: { condition: t.rearRightTread || 60, brand: t.rearRightBrand || 'JK 2019' },
              rearLeft: { condition: t.rearLeftTread || 60, brand: t.rearLeftBrand || 'JK 2019' },
              frontLeft: { condition: t.frontLeftTread || 60, brand: t.frontLeftBrand || 'JK 2019' },
              spareWheel: { condition: t.spareTread || 40, brand: t.spareBrand || 'Bridgestone 2015' },
            });
            setEmergencyState({
              Jack: t.hasJack || false,
              Handle: t.hasHandle || false,
              'Tool Kit': t.hasToolkit || false,
              'First Aid Box': t.hasFirstAidBox || false,
              'Emergency Triangle': t.hasTriangle || false,
            });
          }

          if (details.interiorDetails) {
            const int = details.interiorDetails;
            setElectricalState({
              'Battery Company': int.batteryBrand || '',
              'Full Battery Number': int.batterySerialNumber || '',
              AC: int.acCooling || '',
              'Push Start Button': int.pushButton || 'OK / WORKING',
              Sunroof: int.sunroof || 'OK / WORKING',
              'Right Side Tail Lamp': int.rightTailLamp || 'OK / WORKING',
              'Left Side Tail Lamp': int.leftTailLamp || 'OK / WORKING',
              'Right Side Head Light': int.rightHeadLamp || 'OK / WORKING',
              'Left Side Head Light': int.leftHeadLamp || 'OK / WORKING',
              'Right Indicator': int.indicators || 'OK / WORKING',
              'Left Indicator': int.indicators || 'OK / WORKING',
              'Boot Floor': int.bootFloor || 'OK / WORKING',
              Dashboard: int.dashboard || 'OK / WORKING',
              'Left Side Fog Lamp': int.fogLamps || 'OK / WORKING',
              'Right Side Fog Lamp': int.fogLamps || 'OK / WORKING',
              'Power Window All Buttons': int.powerWindows || 'OK / WORKING',
              'Music System': int.musicSystem || 'OK / WORKING',
              'Steering Mounted Controls': int.steeringMountedControls || 'OK / WORKING',
              'Wiper Washer Front': int.wiper || 'OK / WORKING',
              'Rear Defogger': int.rearDefogger || 'OK / WORKING',
              'Rear Wiper Washer': int.rearWasher || 'OK / WORKING',
              'Instrument Cluster': int.instrumentCluster || 'OK / WORKING',
              'Infotainment System': int.infotainment || 'OK / WORKING',
              'Central Lock': int.centralLock || 'OK / WORKING',
              'All Sensors': int.sensors || 'OK / WORKING',
            });
            setComments(int.remarks || '');
          }

          const imageMap: Record<string, string> = {};
          const checklistImageMap: Record<string, string> = {};
          const allChecklistNames = [
            ...exteriorPanels,
            ...mechanicalItems.map((m) => m.name),
            ...electricalItems,
            'Battery Company',
            'Full Battery Number',
          ];

          if (details.inspectionPhotos && Array.isArray(details.inspectionPhotos)) {
            details.inspectionPhotos.forEach((img: any) => {
              if (!img.imageUrl) return;
              if (isVideoUrl(img.imageUrl)) return;
              let slotKey = img.photoType ? photoTypeToSlotKeyMap[img.photoType] : undefined;
              if (!slotKey) {
                const cat = img.imageCategory || img.displayName || '';
                slotKey = Object.keys(slotToCategoryMap).find((k) => slotToCategoryMap[k].toLowerCase() === cat.toLowerCase());
              }
              if (slotKey) imageMap[slotKey] = img.imageUrl;

              const rawCat = img.imageCategory || img.displayName;
              if (rawCat) {
                checklistImageMap[rawCat] = img.imageUrl;
                const matchName = allChecklistNames.find((name) => name.trim().toLowerCase() === rawCat.trim().toLowerCase());
                if (matchName) checklistImageMap[matchName] = img.imageUrl;
              }
            });
          }

          // Process inspectionVideos & videoUrl strictly for 'Engine / Motor Noise' ONLY
          const rawVideos = (details.inspectionVideos || []).concat(
            details.videoUrl ? [{ videoUrl: details.videoUrl, displayName: 'Vehicle Walkaround' }] : []
          );

          if (rawVideos.length > 0) {
            rawVideos.forEach((vid: any) => {
              const vUrl = vid.videoUrl || vid.imageUrl || vid.url;
              if (!vUrl) return;
              // Map strictly and ONLY to Engine / Motor Noise
              checklistImageMap['Engine / Motor Noise'] = vUrl;
            });
          }

          setPartImages((p) => ({ ...p, ...imageMap }));
          setPanelImages((p) => ({ ...p, ...checklistImageMap }));
        }
      } catch (err: any) {
        console.error('Failed to load inspection details', err);
        showToast({ message: 'Failed to fetch inspection details from server.', type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (routeId && !isLoadedRef.current) {
      const idNum = Number(routeId);
      if (!isNaN(idNum)) {
        isLoadedRef.current = true;
        setInspectionId(idNum);
        loadInspectionData(idNum);
      }
    }
  }, [routeId, loadInspectionData]);

  /* ── State helpers ── */
  const setBasic = (k: string, v: string) => {
    setBasicDetails((p) => ({ ...p, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });
    }
  };

  const setExt = (panel: string, status: string) => {
    setExteriorState((p) => ({ ...p, [panel]: status }));
    const s = (status || '').toUpperCase().trim();
    if (s === 'NA' || s === 'N/A' || s === 'NOT APPLICABLE') {
      setPanelImages((prev) => {
        if (!prev[panel]) return prev;
        const copy = { ...prev };
        delete copy[panel];
        return copy;
      });
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[panel];
        return copy;
      });
    }
  };

  const setMech = (item: string, val: string) => {
    setMechanicalState((p) => ({ ...p, [item]: val }));
    const v = (val || '').toUpperCase().trim();
    if (v === 'NA' || v === 'N/A' || v === 'NOT APPLICABLE') {
      setPanelImages((prev) => {
        if (!prev[item]) return prev;
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    }
  };

  const setEmerg = (item: string, val: boolean) => setEmergencyState((p) => ({ ...p, [item]: val }));

  const setElec = (item: string, val: string) => {
    setElectricalState((p) => ({ ...p, [item]: val }));
    const v = (val || '').toUpperCase().trim();
    if (v === 'NA' || v === 'N/A' || v === 'NOT APPLICABLE') {
      setPanelImages((prev) => {
        if (!prev[item]) return prev;
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    }
    if (errors[item]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    }
  };

  const setSlotImg = (key: string, url: string) => {
    setPartImages((p) => ({ ...p, [key]: url }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const removeSlotImg = (key: string) =>
    setPartImages((p) => {
      const copy = { ...p };
      delete copy[key];
      return copy;
    });

  const handleSuggestedPriceChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let formattedVal = parts[0];
    if (parts.length > 1) formattedVal += '.' + parts.slice(1).join('');
    setSuggestedPrice(formattedVal);
    if (errors.suggestedPrice) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.suggestedPrice;
        return copy;
      });
    }
  };

  /* ── Validation ── */
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!basicDetails.customerName) newErrors.customerName = 'Customer Name is required.';
      else if (basicDetails.customerName.trim().length < 2) newErrors.customerName = 'Customer Name must be at least 2 characters.';
      if (!basicDetails.customerMobile) newErrors.customerMobile = 'Customer Mobile Number is required.';
      else if (!/^[6-9]\d{9}$/.test(basicDetails.customerMobile)) newErrors.customerMobile = 'Enter a valid 10-digit mobile number.';
      if (!basicDetails.regNo) newErrors.regNo = 'Registration Number is required.';
      else if (!isValidRegNo(basicDetails.regNo)) newErrors.regNo = 'Enter a valid registration number (e.g., MH12AB1234).';
      if (!basicDetails.brand) newErrors.brand = 'Vehicle Brand / Make is required.';
      else if (basicDetails.brand.trim().length < 2) newErrors.brand = 'Vehicle Brand / Make must be at least 2 characters.';
      if (!basicDetails.model) newErrors.model = 'Model Name is required.';
      else if (basicDetails.model.trim().length < 2) newErrors.model = 'Model Name must be at least 2 characters.';
      if (!basicDetails.variant) newErrors.variant = 'Model Variant is required.';
      else if (basicDetails.variant.trim().length < 2) newErrors.variant = 'Model Variant must be at least 2 characters.';
      if (!basicDetails.year) newErrors.year = 'Manufacturing Year is required.';
      if (!basicDetails.regYear) newErrors.regYear = 'Registration Year is required.';
      if (!basicDetails.fuel) newErrors.fuel = 'Fuel Type is required.';
      if (!basicDetails.transmission) newErrors.transmission = 'Transmission is required.';
      if (!basicDetails.odometer) newErrors.odometer = 'Odometer Reading is required.';
      if (!basicDetails.ownerName) newErrors.ownerName = 'Owner Profile Status is required.';
      if (!basicDetails.insurance) newErrors.insurance = 'Insurance Validity is required.';
      if (!suggestedPrice) newErrors.suggestedPrice = 'Suggested Price is required.';
      else if (isNaN(Number(suggestedPrice.replace(/,/g, '')))) newErrors.suggestedPrice = 'Please enter a valid numeric price.';
      if (!basicDetails.location) newErrors.location = 'Location is required.';
      if (!basicDetails.rtoInformation) newErrors.rtoInformation = 'RTO Information is required.';
      if (!basicDetails.rsAvailability) newErrors.rsAvailability = 'RS Availability status is required.';
      if (!basicDetails.duplicateKey) newErrors.duplicateKey = 'Duplicate Key Availability status is required.';
      if (!basicDetails.rtoNocIssued) newErrors.rtoNocIssued = 'RTO NOC Issued status is required.';
      if (!basicDetails.underHypothecation) newErrors.underHypothecation = 'Under Hypothecation status is required.';
      if (!basicDetails.mismatchInRc) newErrors.mismatchInRc = 'Mismatch in RC status is required.';
      if (!basicDetails.roadTaxPaid) newErrors.roadTaxPaid = 'Road Tax Paid status is required.';
      if (!basicDetails.fitnessUpto) newErrors.fitnessUpto = 'Fitness Valid Upto Date is required.';
    } else if (stepIndex === 1) {
      const extSlots = ['frontSide', 'rightSide', 'rearSide', 'leftSide', 'roofTop'];
      extSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      exteriorPanels.forEach((panel) => {
        const cond = exteriorState[panel] || 'OK';
        if (cond !== 'NA' && cond !== 'N/A' && !panelImages[panel]) {
          newErrors[panel] = `Photo is required for ${panel}.`;
        }
      });
    } else if (stepIndex === 2) {
      const mechSlots = ['engineImg', 'batteryImg'];
      mechSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      mechanicalItems.forEach((item) => {
        const cond = mechanicalState[item.name];
        if (cond !== 'NA' && cond !== 'N/A' && !panelImages[item.name]) {
          newErrors[item.name] = `Photo is required for ${item.name}.`;
        }
      });
    } else if (stepIndex === 3) {
      const tyreSlots = ['rfTyreImg', 'rrTyreImg', 'lrTyreImg', 'lfTyreImg', 'spareWheelImg', 'tyresGeneralImg'];
      tyreSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
    } else if (stepIndex === 4) {
      if (!electricalState['Battery Company']) newErrors['Battery Company'] = 'Battery Company is required.';
      if (!electricalState['Full Battery Number']) newErrors['Full Battery Number'] = 'Full Battery Number is required.';
      if (!electricalState['AC']) newErrors['AC'] = 'AC Cooling Performance is required.';

      const intSlots = ['odometerImg', 'acImg'];
      intSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      electricalItems.forEach((item) => {
        const cond = electricalState[item];
        if (cond !== 'NA' && cond !== 'N/A' && !panelImages[item]) {
          newErrors[item] = `Photo is required for ${item}.`;
        }
      });
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      showToast({ message: 'Please complete all required fields on the current step.', type: 'error' });
    }
    return isValid;
  };

  /* ── Payload & API calls ── */
  const saveDraftApiCall = async (showToastMsg = true): Promise<any> => {
    if (!basicDetails.regNo || !isValidRegNo(basicDetails.regNo)) {
      showToast({ message: 'Enter a valid registration number (e.g., MH12AB1234).', type: 'error' });
      throw new Error('Invalid registration number');
    }

    setSaving(true);
    try {
      const payload = {
        vehicleDetails: {
          vehicleNumber: basicDetails.regNo,
          ownerName: basicDetails.ownerName || '1st Owner',
          customerName: basicDetails.customerName,
          customerMobileNumber: basicDetails.customerMobile,
          brand: basicDetails.brand,
          model: basicDetails.model,
          variant: basicDetails.variant,
          manufacturingYear: parseInt(basicDetails.year) || undefined,
          registrationYear: parseInt(basicDetails.regYear) || undefined,
          fuelType: basicDetails.fuel,
          transmission: basicDetails.transmission,
          odometerReading: parseInt(basicDetails.odometer) || undefined,
          insuranceStatus: basicDetails.insurance,
          inspectorCode: basicDetails.evaluator || '',
          suggestedPrice: parseFloat(suggestedPrice.replace(/,/g, '')) || undefined,
          location: basicDetails.location,
          rtoInformation: basicDetails.rtoInformation,
          rsAvailability: basicDetails.rsAvailability,
          duplicateKey: basicDetails.duplicateKey,
          rtoNocIssued: basicDetails.rtoNocIssued,
          underHypothecation: basicDetails.underHypothecation,
          mismatchInRc: basicDetails.mismatchInRc,
          roadTaxPaid: basicDetails.roadTaxPaid,
          fitnessUpto: basicDetails.fitnessUpto,
        },
        exteriorPanelDetails: exteriorPanels.map((panelName) => ({
          panelName,
          condition: mapCondition(exteriorState[panelName] || 'OK'),
          imageUrl: panelImages[panelName] || undefined,
        })),
        mechanicalDetails: {
          engineStatus: mechanicalState['Engine / Motor Status'] || 'OK',
          engineOil: mechanicalState['Engine Oil'] || 'OK',
          brakeOil: mechanicalState['Brakes Oil'] || 'SATISFACTORY',
          steeringOil: mechanicalState['Steering Oil'] || 'OK',
          coolant: mechanicalState['Coolant'] || 'OK',
          brakeBooster: mechanicalState['Brakes Booster'] || 'OK',
          brakeWorking: mechanicalState['Brakes Working'] || 'OK',
          apron: mechanicalState['Apron Condition'] || 'OK',
          chassis: mechanicalState['Chassis Alignment'] || 'OK',
          suspension: mechanicalState['Suspension'] || 'OK',
          bush: mechanicalState['Suspension Bushing'] || 'OK',
          leakage: mechanicalState['Oil Leakage'] || 'OK',
          smoke: mechanicalState['Exhaust Smoke Color'] || 'COLOURLESS',
          transmission: mechanicalState['Manual Transmission Fluid Level'] || 'OK',
          differential: mechanicalState['Differential Fluid Level'] || 'OK',
          fluidLeakage: mechanicalState['Fluid Leakages'] || 'NO LEAKAGE',
          gearbox: mechanicalState['Steering Gearbox & Linkage'] || 'OK',
          axle: mechanicalState['Driveline / Axle'] || 'OK',
          engineNoise: mechanicalState['Engine / Motor Noise'] || 'NORMAL',
        },
        tyreDetails: {
          frontLeftBrand: tyreState.frontLeft.brand,
          frontLeftTread: tyreState.frontLeft.condition,
          frontLeftYear: 2020,
          frontRightBrand: tyreState.frontRight.brand,
          frontRightTread: tyreState.frontRight.condition,
          frontRightYear: 2020,
          rearLeftBrand: tyreState.rearLeft.brand,
          rearLeftTread: tyreState.rearLeft.condition,
          rearLeftYear: 2020,
          rearRightBrand: tyreState.rearRight.brand,
          rearRightTread: tyreState.rearRight.condition,
          rearRightYear: 2020,
          spareBrand: tyreState.spareWheel.brand,
          spareTread: tyreState.spareWheel.condition,
          spareYear: 2020,
          hasJack: emergencyState['Jack'] ?? false,
          hasHandle: emergencyState['Handle'] ?? false,
          hasToolkit: emergencyState['Tool Kit'] ?? false,
          hasTriangle: emergencyState['Emergency Triangle'] ?? false,
          hasFirstAidBox: emergencyState['First Aid Box'] ?? false,
        },
        interiorDetails: {
          batteryBrand: electricalState['Battery Company'] || '',
          batterySerialNumber: electricalState['Full Battery Number'] || '',
          acCooling: electricalState['AC'] || '',
          evaluatorValuation: parseFloat(suggestedPrice.replace(/,/g, '')) || 0,
          rightTailLamp: electricalState['Right Side Tail Lamp'] || 'OK / WORKING',
          leftTailLamp: electricalState['Left Side Tail Lamp'] || 'OK / WORKING',
          rightHeadLamp: electricalState['Right Side Head Light'] || 'OK / WORKING',
          leftHeadLamp: electricalState['Left Side Head Light'] || 'OK / WORKING',
          indicators: electricalState['Right Indicator'] || 'OK / WORKING',
          bootFloor: electricalState['Boot Floor'] || 'OK / WORKING',
          dashboard: electricalState['Dashboard'] || 'OK / WORKING',
          fogLamps: electricalState['Left Side Fog Lamp'] || 'OK / WORKING',
          powerWindows: electricalState['Power Window All Buttons'] || 'OK / WORKING',
          musicSystem: electricalState['Music System'] || 'OK / WORKING',
          steeringMountedControls: electricalState['Steering Mounted Controls'] || 'OK / WORKING',
          wiper: electricalState['Wiper Washer Front'] || 'OK / WORKING',
          rearDefogger: electricalState['Rear Defogger'] || 'OK / WORKING',
          rearWasher: electricalState['Rear Wiper Washer'] || 'OK / WORKING',
          instrumentCluster: electricalState['Instrument Cluster'] || 'OK / WORKING',
          infotainment: electricalState['Infotainment System'] || 'OK / WORKING',
          centralLock: electricalState['Central Lock'] || 'OK / WORKING',
          pushButton: electricalState['Push Start Button'] || 'OK / WORKING',
          sunroof: electricalState['Sunroof'] || 'OK / WORKING',
          sensors: electricalState['All Sensors'] || 'OK / WORKING',
          remarks: comments,
        },
        exteriorRating,
        mechanicalRating,
        tyreRating,
        interiorRating: electricalRating,
      };

      let res;
      if (inspectionId) {
        res = await inspectorService.updateDraft(inspectionId, payload);
      } else {
        res = await inspectorService.saveDraft(payload);
      }

      if (res.success && res.data) {
        const details = res.data;
        const newId = details.inspectionId || details.id;
        if (newId && newId !== inspectionId) {
          setInspectionId(newId);
        }
        if (showToastMsg) {
          showToast({ message: 'Draft saved successfully to server.', type: 'success' });
        }
        return res;
      }
    } catch (err: any) {
      console.error('Autosave draft failed', err);
      showToast({ message: err?.response?.data?.message || 'Failed to save draft.', type: 'error' });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const pickAndUpload = async (
    key: string,
    category: string,
    isVideo = false,
  ) => {
    try {
      const picked = await pick({
        type: isVideo ? [types.video] : [types.images],
        allowMultiSelection: false,
      });
      const file = picked[0];
      if (!file) return;

      let currentId = inspectionId;
      if (!currentId) {
        if (!basicDetails.regNo) {
          showToast({ message: 'Please enter the vehicle registration number first before uploading photos.', type: 'error' });
          return;
        }
        try {
          const res = await saveDraftApiCall(false);
          if (res && res.data) {
            currentId = res.data.inspectionId || res.data.id;
          }
        } catch (err) {
          return;
        }
      }
      if (!currentId) return;

      setUploadingKey(key);
      try {
        const res = await inspectorService.uploadImage(currentId, category, {
          uri: file.uri,
          name: file.name || `${category}.${isVideo ? 'mp4' : 'jpg'}`,
          type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
        if (res.success && res.data) {
          setSlotImg(key, res.data);
          showToast({ message: `Image uploaded for ${category}!`, type: 'success' });
        }
      } catch (err: any) {
        showToast({ message: err?.response?.data?.message || 'Failed to upload image.', type: 'error' });
      } finally {
        setUploadingKey(null);
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      showToast({ message: 'Failed to pick file.', type: 'error' });
    }
  };

  const pickAndUploadPanel = async (panelName: string) => {
    const isVideo = panelName === 'Engine / Motor Noise';
    try {
      const picked = await pick({
        type: isVideo ? [types.video] : [types.images],
        allowMultiSelection: false,
      });
      const file = picked[0];
      if (!file) return;

      let currentId = inspectionId;
      if (!currentId) {
        if (!basicDetails.regNo) {
          showToast({ message: 'Please enter the vehicle registration number first before uploading photos.', type: 'error' });
          return;
        }
        try {
          const res = await saveDraftApiCall(false);
          if (res && res.data) {
            currentId = res.data.inspectionId || res.data.id;
          }
        } catch (err) {
          return;
        }
      }
      if (!currentId) return;

      setUploadingKey(panelName);
      try {
        const res = await inspectorService.uploadImage(currentId, panelName, {
          uri: file.uri,
          name: file.name || `${panelName}.${isVideo ? 'mp4' : 'jpg'}`,
          type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
        if (res.success && res.data) {
          setPanelImages((prev) => ({ ...prev, [panelName]: res.data }));
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy[panelName];
            return copy;
          });
          showToast({ message: `${isVideo ? 'Video' : 'Photo'} uploaded for ${panelName}!`, type: 'success' });
        }
      } catch (err: any) {
        showToast({ message: err?.response?.data?.message || 'Failed to upload panel media.', type: 'error' });
      } finally {
        setUploadingKey(null);
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      showToast({ message: 'Failed to pick file.', type: 'error' });
    }
  };

  const handleFinalSubmit = async () => {
    if (!inspectionId) {
      showToast({ message: 'No active draft found. Please fill vehicle specs first.', type: 'error' });
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        showToast({ message: `Please complete all required fields and image uploads in Step ${i + 1}: ${steps[i].title}.`, type: 'error' });
        return;
      }
    }
    try {
      await saveDraftApiCall(false);
      showToast({ message: 'Submitting inspection report to administrator...', type: 'info' });
      const res = await inspectorService.submitReport(inspectionId);
      if (res.success) {
        showToast({ message: 'Inspection submitted successfully!', type: 'success' });
        navigation.goBack();
      }
    } catch (err: any) {
      showToast({
        message: err?.response?.data?.message || 'Submission failed. Ensure all mandatory images and sections are completed.',
        type: 'error',
      });
    }
  };

  const goNext = async () => {
    if (!validateStep(step)) return;
    try {
      await saveDraftApiCall(false);
      setStep((s) => s + 1);
    } catch (err) {
      // errors already surfaced
    }
  };

  /* ── Render ── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Perform Evaluation
          </Text>
        </View>
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>Step {step + 1} of {steps.length}</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={[styles.stepsBar, { backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsRow}>
          {steps.map((s, idx) => {
            const active = step === idx;
            const done = idx < step;
            return (
              <View
                key={s.title}
                style={[
                  styles.stepCard,
                  active
                    ? { borderColor: '#FFC700', backgroundColor: 'rgba(255,199,0,0.06)' }
                    : done
                      ? { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.06)' }
                      : { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                {done && <CheckCircle2 size={13} color="#10B981" style={styles.stepDoneIcon} />}
                <Text style={[styles.stepCardTitle, { color: colors.foreground }]}>{s.title}</Text>
                <Text style={[styles.stepCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>{s.subtitle}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator color="#FFC700" size="small" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentBody}>
            {/* ── STEP 1: Vehicle Specs ── */}
            {step === 0 && (
              <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 1: Vehicle Specifications</Text>
                <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                  Capture legal registration certificate and owner profile credentials.
                </Text>
                <View style={styles.panelBody}>
                  <View style={styles.formGrid}>
                    <TextField
                      label="Customer Name"
                      value={basicDetails.customerName}
                      placeholder="e.g. Rahul Sharma"
                      error={errors.customerName}
                      onChange={(v) => setBasic('customerName', v)}
                      colors={colors}
                    />
                    <TextField
                      label="Customer Mobile Number"
                      value={basicDetails.customerMobile}
                      placeholder="e.g. 9876543210"
                      error={errors.customerMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                      numericOnly
                      onChange={(v) => setBasic('customerMobile', v)}
                      colors={colors}
                    />
                    <TextField
                      label="Registration Number"
                      value={basicDetails.regNo}
                      placeholder="e.g. MH12LV2376"
                      error={errors.regNo}
                      uppercase
                      onChange={(v) => setBasic('regNo', v)}
                      colors={colors}
                    />
                    <TextField
                      label="Vehicle Brand / Make"
                      value={basicDetails.brand}
                      placeholder="e.g. TOYOTA"
                      error={errors.brand}
                      uppercase
                      onChange={(v) => setBasic('brand', v)}
                      colors={colors}
                    />
                    <TextField
                      label="Model Name"
                      value={basicDetails.model}
                      placeholder="e.g. ETIOS LIVA"
                      error={errors.model}
                      uppercase
                      onChange={(v) => setBasic('model', v)}
                      colors={colors}
                    />
                    <TextField
                      label="Model Variant"
                      value={basicDetails.variant}
                      placeholder="e.g. Vx"
                      error={errors.variant}
                      onChange={(v) => setBasic('variant', v)}
                      colors={colors}
                    />
                    <PickerField
                      label="Manufacturing Year"
                      value={basicDetails.year}
                      options={years}
                      placeholder="Select Year"
                      error={errors.year}
                      onChange={(v) => setBasic('year', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Registration Year"
                      value={basicDetails.regYear}
                      options={years}
                      placeholder="Select Registration Year"
                      error={errors.regYear}
                      onChange={(v) => setBasic('regYear', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Fuel Type"
                      value={basicDetails.fuel}
                      options={['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric', 'Hybrid']}
                      placeholder="Select Fuel Type"
                      error={errors.fuel}
                      onChange={(v) => setBasic('fuel', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Transmission"
                      value={basicDetails.transmission}
                      options={['Manual (MT)', 'Automatic (AT)']}
                      placeholder="Select Transmission"
                      error={errors.transmission}
                      onChange={(v) => setBasic('transmission', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <TextField
                      label="Odometer Reading (km)"
                      value={basicDetails.odometer}
                      placeholder="e.g. 30899"
                      error={errors.odometer}
                      keyboardType="number-pad"
                      numericOnly
                      onChange={(v) => setBasic('odometer', v)}
                      colors={colors}
                    />
                    <PickerField
                      label="Owner Profile Status"
                      value={basicDetails.ownerName}
                      options={['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5th Owner or More']}
                      placeholder="Select Owner Profile Status"
                      error={errors.ownerName}
                      onChange={(v) => setBasic('ownerName', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Insurance Validity"
                      value={basicDetails.insurance}
                      options={['Valid (Comprehensive)', 'Valid (Third Party)', 'Expired', 'No Insurance']}
                      placeholder="Select Insurance Type"
                      error={errors.insurance}
                      onChange={(v) => setBasic('insurance', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <TextField
                      label="Price (₹)"
                      value={suggestedPrice}
                      placeholder="e.g. 350000"
                      error={errors.suggestedPrice}
                      keyboardType="number-pad"
                      numericOnly
                      onChange={handleSuggestedPriceChange}
                      colors={colors}
                    />
                    <TextField
                      label="Location"
                      value={basicDetails.location}
                      placeholder="e.g. Mumbai, Maharashtra"
                      error={errors.location}
                      onChange={(v) => setBasic('location', v)}
                      colors={colors}
                    />
                    <TextField
                      label="RTO Information"
                      value={basicDetails.rtoInformation}
                      placeholder="e.g. MH12 Pune RTO"
                      error={errors.rtoInformation}
                      onChange={(v) => setBasic('rtoInformation', v)}
                      colors={colors}
                    />
                    <PickerField
                      label="RS Availability (Roadside Assistance)"
                      value={basicDetails.rsAvailability}
                      options={['Available (Yes)', 'Not Available (No)']}
                      placeholder="Select RS Availability"
                      error={errors.rsAvailability}
                      onChange={(v) => setBasic('rsAvailability', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Duplicate Key Availability"
                      value={basicDetails.duplicateKey}
                      options={['Yes', 'No']}
                      placeholder="Select Duplicate Key Availability"
                      error={errors.duplicateKey}
                      onChange={(v) => setBasic('duplicateKey', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="RTO NOC Issued"
                      value={basicDetails.rtoNocIssued}
                      options={['Yes', 'No']}
                      placeholder="Select RTO NOC Status"
                      error={errors.rtoNocIssued}
                      onChange={(v) => setBasic('rtoNocIssued', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Under Hypothecation"
                      value={basicDetails.underHypothecation}
                      options={['Yes', 'No', 'N/A']}
                      placeholder="Select Hypothecation Status"
                      error={errors.underHypothecation}
                      onChange={(v) => setBasic('underHypothecation', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Mismatch in RC"
                      value={basicDetails.mismatchInRc}
                      options={['No Mismatch (Clean)', 'Mismatch (Yes)']}
                      placeholder="Select RC Mismatch Status"
                      error={errors.mismatchInRc}
                      onChange={(v) => setBasic('mismatchInRc', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <PickerField
                      label="Road Tax Paid Status"
                      value={basicDetails.roadTaxPaid}
                      options={['Individual / One Time', 'Limited Period', 'N/A', 'Paid']}
                      placeholder="Select Road Tax Paid Status"
                      error={errors.roadTaxPaid}
                      onChange={(v) => setBasic('roadTaxPaid', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                    <DatePickerField
                      label="Fitness Valid Upto Date"
                      value={basicDetails.fitnessUpto}
                      placeholder="Select Fitness Expiry Date (YYYY-MM-DD)"
                      error={errors.fitnessUpto}
                      onChange={(v) => setBasic('fitnessUpto', v)}
                      colors={colors}
                      isDark={isDark}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ── STEP 2: Exterior ── */}
            {step === 1 && (
              <View style={{ gap: 14 }}>
                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <View style={styles.panelTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 2: Exterior Body Checklist</Text>
                      <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                        State condition and paint parameters of exterior sheet metal panels.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingBlock}>
                    <StarRating value={exteriorRating} onChange={setExteriorRating} colors={colors} />
                  </View>
                  <View style={styles.panelBody}>
                    <View style={styles.checkListGrid}>
                      {exteriorPanels.map((panel) => {
                        const value = exteriorState[panel] ?? 'OK';
                        return (
                          <ChecklistItem
                            key={panel}
                            label={panel}
                            value={value}
                            options={panelConditions}
                            image={panelImages[panel]}
                            error={errors[panel]}
                            uploading={uploadingKey === panel}
                            onValueChange={(val) => setExt(panel, val)}
                            onPick={() => pickAndUploadPanel(panel)}
                            onRemove={() => setPanelImages((prev) => {
                              const copy = { ...prev };
                              delete copy[panel];
                              return copy;
                            })}
                            colors={colors}
                            isDark={isDark}
                          />
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
                        <PhotoSlot
                          key={slot.key}
                          label={slot.label}
                          value={partImages[slot.key]}
                          error={errors[slot.key]}
                          uploading={uploadingKey === slot.key}
                          onPick={() => pickAndUpload(slot.key, slotToCategoryMap[slot.key])}
                          onRemove={() => removeSlotImg(slot.key)}
                          colors={colors}
                          isDark={isDark}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── STEP 3: Mechanical ── */}
            {step === 2 && (
              <View style={{ gap: 14 }}>
                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <View style={styles.panelTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 3: Mechanical Health Diagnostics</Text>
                      <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                        Check items inside engine compartment, transmission bay and brake assemblies.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingBlock}>
                    <StarRating value={mechanicalRating} onChange={setMechanicalRating} colors={colors} />
                  </View>
                  <View style={styles.panelBody}>
                    <View style={styles.checkListGrid}>
                      {mechanicalItems.map((item) => {
                        const value =
                          mechanicalState[item.name] ??
                          (item.type === 'fluid' ? item.options?.[0] : item.default ?? 'OK');
                        const opts = item.type === 'fluid'
                          ? [...(item.options || []), 'N/A']
                          : item.type === 'text'
                            ? [value]
                            : ['OK', 'NOT OK', 'N/A'];
                        return (
                          <ChecklistItem
                            key={item.name}
                            label={item.name}
                            value={value}
                            options={opts}
                            image={panelImages[item.name]}
                            error={errors[item.name]}
                            isVideo={item.name === 'Engine / Motor Noise'}
                            uploading={uploadingKey === item.name}
                            onValueChange={(val) => setMech(item.name, val)}
                            onPick={() => pickAndUploadPanel(item.name)}
                            onRemove={() => setPanelImages((prev) => {
                              const copy = { ...prev };
                              delete copy[item.name];
                              return copy;
                            })}
                            colors={colors}
                            isDark={isDark}
                          />
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
                        <PhotoSlot
                          key={slot.key}
                          label={slot.label}
                          value={partImages[slot.key]}
                          error={errors[slot.key]}
                          uploading={uploadingKey === slot.key}
                          onPick={() => pickAndUpload(slot.key, slotToCategoryMap[slot.key])}
                          onRemove={() => removeSlotImg(slot.key)}
                          colors={colors}
                          isDark={isDark}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── STEP 4: Tyres ── */}
            {step === 3 && (
              <View style={{ gap: 14 }}>
                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <View style={styles.panelTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.panelTitle, { color: colors.foreground }]}>Step 4: Tyres Specifications</Text>
                      <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                        Enter remaining tread depth percentage and brand names for all wheels.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ratingBlock}>
                    <StarRating value={tyreRating} onChange={setTyreRating} colors={colors} />
                  </View>
                  <View style={styles.panelBody}>
                    {tyrePositions.map((pos) => {
                      const tyre = tyreState[pos.id] || { condition: 60, brand: 'JK 2019' };
                      return (
                        <View key={pos.id} style={[styles.tyreFormCard, { borderColor: colors.border, backgroundColor: cardBg }]}>
                          <View style={styles.tyreFormHeader}>
                            <Text style={[styles.tyreFormTitle, { color: colors.foreground }]}>{pos.label}</Text>
                            <View style={styles.treadRemainPill}>
                              <Text style={styles.treadRemainText}>{tyre.condition}% Remaining</Text>
                            </View>
                          </View>
                          <View style={styles.tyreFormBody}>
                            <View style={styles.tyreField}>
                              <Text style={[styles.tyreFieldLabel, { color: colors.mutedForeground }]}>Tread Depth (0-100%)</Text>
                              <TextInput
                                style={[styles.tyreInput, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
                                keyboardType="number-pad"
                                value={String(tyre.condition)}
                                onChangeText={(t) => {
                                  const num = parseInt(t.replace(/[^0-9]/g, ''), 10);
                                  const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
                                  setTyreState((p) => ({ ...p, [pos.id]: { ...tyre, condition: clamped } }));
                                }}
                              />
                            </View>
                            <View style={styles.tyreField}>
                              <Text style={[styles.tyreFieldLabel, { color: colors.mutedForeground }]}>Tyre Brand & Batch Code</Text>
                              <TextInput
                                style={[styles.tyreInput, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
                                value={tyre.brand}
                                onChangeText={(t) => setTyreState((p) => ({ ...p, [pos.id]: { ...tyre, brand: t } }))}
                              />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>Emergency Toolkit Checklist</Text>
                  <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                    Mark available emergency supplies and tools found inside boot drawer.
                  </Text>
                  <View style={styles.panelBody}>
                    {emergencyItems.map((item) => {
                      const checked = emergencyState[item] ?? false;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.emergencyRow, { borderColor: checked ? '#FFC700' : colors.border, backgroundColor: checked ? 'rgba(255,199,0,0.06)' : cardBg }]}
                          onPress={() => setEmerg(item, !checked)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.emergencyLabel, { color: colors.foreground }]}>{item}</Text>
                          <View style={[styles.emergencyCheck, checked && styles.emergencyCheckOn]}>
                            {checked && <CheckCircle2 size={14} color="#0D0E12" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
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
                        <PhotoSlot
                          key={slot.key}
                          label={slot.label}
                          value={partImages[slot.key]}
                          error={errors[slot.key]}
                          uploading={uploadingKey === slot.key}
                          onPick={() => pickAndUpload(slot.key, slotToCategoryMap[slot.key])}
                          onRemove={() => removeSlotImg(slot.key)}
                          colors={colors}
                          isDark={isDark}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── STEP 5: Interior ── */}
            {step === 4 && (
              <View style={{ gap: 14 }}>
                <View style={[styles.panelCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>Cabin & Electrical Components</Text>
                  <Text style={[styles.panelDesc, { color: colors.mutedForeground }]}>
                    Upload odometer and AC control photo slots.
                  </Text>
                  <View style={styles.panelBody}>
                    <View style={styles.photoGrid}>
                      {imageSlotsConfig.filter((slot) => slot.step === 4).map((slot) => (
                        <PhotoSlot
                          key={slot.key}
                          label={slot.label}
                          value={partImages[slot.key]}
                          error={errors[slot.key]}
                          uploading={uploadingKey === slot.key}
                          onPick={() => pickAndUpload(slot.key, slotToCategoryMap[slot.key])}
                          onRemove={() => removeSlotImg(slot.key)}
                          colors={colors}
                          isDark={isDark}
                        />
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
                  </View>
                  <View style={styles.ratingBlock}>
                    <StarRating value={electricalRating} onChange={setElectricalRating} colors={colors} />
                  </View>
                  <View style={styles.panelBody}>
                    <View style={styles.formGrid}>
                      <TextField
                        label="Battery Brand"
                        value={electricalState['Battery Company']}
                        error={errors['Battery Company']}
                        onChange={(v) => setElec('Battery Company', v)}
                        colors={colors}
                      />
                      <TextField
                        label="Battery Serial No."
                        value={electricalState['Full Battery Number']}
                        error={errors['Full Battery Number']}
                        onChange={(v) => setElec('Full Battery Number', v)}
                        colors={colors}
                      />
                      <TextField
                        label="AC Cooling Performance"
                        value={electricalState['AC']}
                        error={errors['AC']}
                        onChange={(v) => setElec('AC', v)}
                        colors={colors}
                      />
                    </View>

                    <View style={styles.checkListGrid}>
                      {electricalItems.map((item) => {
                        const status = electricalState[item] ?? 'OK / WORKING';
                        return (
                          <ChecklistItem
                            key={item}
                            label={item}
                            value={status}
                            options={['OK / WORKING', 'NOT WORKING', 'N/A']}
                            image={panelImages[item]}
                            error={errors[item]}
                            uploading={uploadingKey === item}
                            onValueChange={(val) => setElec(item, val)}
                            onPick={() => pickAndUploadPanel(item)}
                            onRemove={() => setPanelImages((prev) => {
                              const copy = { ...prev };
                              delete copy[item];
                              return copy;
                            })}
                            colors={colors}
                            isDark={isDark}
                          />
                        );
                      })}
                    </View>

                    <View style={styles.remarksWrap}>
                      <Text style={[styles.remarksLabel, { color: colors.foreground }]}>Inspector Remarks & Notes</Text>
                      <TextInput
                        style={[styles.remarksInput, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
                        multiline
                        numberOfLines={4}
                        value={comments}
                        onChangeText={setComments}
                        placeholder="Enter your remarks about the vehicle..."
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── Form Action Controls ── */}
            <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.prevBtn, { borderColor: colors.border, backgroundColor: cardBg }]}
                disabled={step === 0}
                onPress={() => setStep((s) => Math.max(0, s - 1))}
                activeOpacity={0.85}
              >
                <Text style={[styles.prevBtnText, { color: colors.foreground }]}>Previous Step</Text>
              </TouchableOpacity>

              <View style={styles.actionRight}>
                <TouchableOpacity
                  style={[styles.saveBtn, { borderColor: colors.border, backgroundColor: cardBg }]}
                  onPress={() => saveDraftApiCall(true)}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFC700" />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Save Draft</Text>
                  )}
                </TouchableOpacity>

                {step < steps.length - 1 ? (
                  <TouchableOpacity style={styles.continueBtn} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.continueBtnText}>Continue Next Step</Text>
                    <ChevronRight size={16} color="#0D0E12" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.submitBtn} onPress={handleFinalSubmit} activeOpacity={0.85}>
                    <ShieldCheck size={16} color="#0D0E12" />
                    <Text style={styles.submitBtnText}>Submit Report to Admin</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
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
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  stepPill: {
    backgroundColor: 'rgba(255,199,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stepPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFC700',
  },
  stepsBar: {
    paddingTop: 12,
  },
  stepsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepCard: {
    width: 150,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  stepDoneIcon: {
    position: 'absolute',
    top: 7,
    right: 7,
  },
  stepCardTitle: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  stepCardSub: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
  },
  centerLoad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBody: {
    padding: 16,
  },
  panelCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  ratingBlock: {
    marginTop: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  formGrid: {
    flexDirection: 'column',
  },
  fieldWrap: {
    width: '100%',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  fieldMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  fieldError: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F43F5E',
    marginTop: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  checkListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  checkItem: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  checkItemName: {
    fontSize: 10.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  checkItemSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  checkItemSelectText: {
    fontSize: 9.5,
    fontWeight: '800',
    maxWidth: 90,
  },
  checkItemPreview: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  checkItemPreviewImg: {
    width: '100%',
    height: '100%',
  },
  checkItemUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  checkItemUploadMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  naTagMini: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  naTagMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  checkItemUploadText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  naTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
    borderRadius: 8,
    paddingVertical: 6,
  },
  videoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
  },
  videoPreviewText: {
    color: '#FFC700',
    fontSize: 9,
    fontWeight: '800',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(244,63,94,0.85)',
    borderRadius: 8,
    padding: 6,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  photoSlotWrap: {
    width: '100%',
    marginBottom: 4,
  },
  photoSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 7,
  },
  photoSlotLabel: {
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
  capturedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  capturedPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10B981',
  },
  requiredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  requiredPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#F59E0B',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadBoxTitle: {
    fontSize: 11,
    fontWeight: '900',
  },
  uploadBoxSub: {
    fontSize: 9,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  photoPreviewActions: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  tyreFormCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  tyreFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(148,163,184,0.3)',
    paddingBottom: 9,
  },
  tyreFormTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  treadRemainPill: {
    backgroundColor: 'rgba(255,199,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  treadRemainText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFC700',
  },
  tyreFormBody: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  tyreField: {
    flex: 1,
  },
  tyreFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  tyreInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '700',
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  emergencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyCheckOn: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700',
  },
  remarksWrap: {
    marginTop: 6,
  },
  remarksLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    fontWeight: '600',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 6,
  },
  prevBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  prevBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  continueBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E12',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E12',
  },
});