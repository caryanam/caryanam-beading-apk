import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle2,
  Camera,
  Video,
  X,
  ChevronDown,
  Trash2,
} from 'lucide-react-native';
import { pick, types } from '@react-native-documents/picker';
import RNVideo from 'react-native-video';
import { freelancerService, resolveMediaUrl } from '../services/freelancerService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface FreelancerAddVehicleScreenProps {
  navigation: any;
  route: any;
  onOpenMenu: () => void;
}

const PHOTO_SLOTS = [
  "Front View",
  "Rear View",
  "Right Side",
  "Left Side",
  "Dashboard",
  "Odometer",
  "Interior / Seats",
  "Engine Bay",
  "Boot Space",
  "RC / Document",
];

const freelancerSteps = [
  { title: "Vehicle & Customer Details", subtitle: "Customer info, vehicle specs, RTO & pricing" },
  { title: "Photos & Video Upload", subtitle: "10 basic photos & 1 walkaround video" },
];

const fuelTypeOptions = ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"];
const transmissionOptions = ["Manual (MT)", "Automatic (AT)"];
const ownerProfileStatusOptions = ["1st Owner", "2nd Owner", "3rd Owner", "4th Owner", "5th Owner or More"];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

// Basic Select Component
const CustomSelect = ({ label, value, options, onSelect, colors, isDark, hasError }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.selectBtn, { borderColor: hasError ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectValueText, { color: value ? colors.foreground : colors.mutedForeground, flex: 1 }]} numberOfLines={1}>
          {value || `Select ${label}`}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4 }}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt: string) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerOption, opt === value && { backgroundColor: 'rgba(255,199,0,0.12)' }]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pickerOptionText, { color: opt === value ? '#FFC700' : colors.foreground, flex: 1 }]} numberOfLines={2}>{opt}</Text>
                  {opt === value && <CheckCircle2 size={16} color="#FFC700" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};


export const FreelancerAddVehicleScreen: React.FC<FreelancerAddVehicleScreenProps> = ({ navigation, route }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const { showToast } = useToast();
  
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  
  const editingId = route.params?.inspectionId || null;

  const [formData, setFormData] = useState({
    customerName: "",
    customerMobileNumber: "",
    registrationNumber: "",
    brand: "",
    model: "",
    variant: "",
    manufacturingYear: "",
    registrationYear: "",
    fuelType: "Petrol",
    transmission: "Manual (MT)",
    odometerReading: "",
    ownerProfileStatus: "1st Owner",
    insuranceValidity: "",
    price: "",
    location: "",
    underHypothecation: "",
    accidental: "No",
    rtoInformation: "",
  });

  const [photoMap, setPhotoMap] = useState<Record<string, { preview: string; file?: any }>>({});
  const [video, setVideo] = useState<{ file?: any; name: string; previewUrl?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidRegNo = (regNo: string): boolean => {
    if (!regNo) return false;
    const clean = regNo.replace(/\s+/g, "").toUpperCase();
    const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
    const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
    const isPureNumeric = /^\d+$/.test(clean);
    const isPureAlpha = /^[A-Z]+$/.test(clean);
    if (isPureNumeric || isPureAlpha) return false;
    return (standardPattern.test(clean) || bhPattern.test(clean)) && clean.length >= 6 && clean.length <= 12;
  };

  const validateStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!formData.customerName || formData.customerName.trim().length < 2) {
        newErrors.customerName = "Customer Name is required (min 2 chars).";
      }
      if (!formData.customerMobileNumber || !formData.customerMobileNumber.trim()) {
        newErrors.customerMobileNumber = "Customer Mobile Number is required.";
      } else if (!/^[6-9]\d{9}$/.test(formData.customerMobileNumber.trim())) {
        newErrors.customerMobileNumber = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
      }
      if (!formData.registrationNumber || !isValidRegNo(formData.registrationNumber)) {
        newErrors.registrationNumber = "Enter a valid registration number (e.g. MH12AB1234).";
      }
      if (!formData.brand || formData.brand.trim().length < 2) {
        newErrors.brand = "Vehicle Brand / Make is required.";
      }
      if (!formData.model || formData.model.trim().length < 2) {
        newErrors.model = "Model Name is required.";
      }
      if (!formData.variant || formData.variant.trim().length < 2) {
        newErrors.variant = "Model Variant is required.";
      }
      if (!formData.manufacturingYear) {
        newErrors.manufacturingYear = "Manufacturing Year is required.";
      }
      if (!formData.registrationYear) {
        newErrors.registrationYear = "Registration Year is required.";
      }
      if (!formData.fuelType) {
        newErrors.fuelType = "Fuel Type is required.";
      }
      if (!formData.transmission) {
        newErrors.transmission = "Transmission is required.";
      }
      if (!formData.odometerReading) {
        newErrors.odometerReading = "Odometer Reading is required.";
      }
      if (!formData.ownerProfileStatus) {
        newErrors.ownerProfileStatus = "Owner Profile Status is required.";
      }
      if (!formData.insuranceValidity) {
        newErrors.insuranceValidity = "Insurance Validity is required.";
      }
      if (!formData.price || isNaN(Number(formData.price))) {
        newErrors.price = "Please enter a valid numeric price.";
      }
      if (!formData.location || !formData.location.trim()) {
        newErrors.location = "Location is required.";
      }
      if (!formData.underHypothecation) {
        newErrors.underHypothecation = "Under Hypothecation status is required.";
      }
      if (!formData.accidental) {
        newErrors.accidental = "Accidental Status is required.";
      }
      if (!formData.rtoInformation || !formData.rtoInformation.trim()) {
        newErrors.rtoInformation = "RTO Information is required.";
      }
    } else if (stepIdx === 1) {
      const uploadedCount = Object.keys(photoMap).length;
      if (uploadedCount < 10) {
        newErrors.photos = `All 10 basic vehicle photos are mandatory. You have uploaded ${uploadedCount} / 10 photos.`;
      }
      if (!video) {
        newErrors.video = "Walkaround Video is required.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast({ message: "Please fix the errors in red before proceeding.", type: "error" });
      return false;
    }
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const loadDraft = useCallback(async () => {
    if (!editingId) return;
    setLoadingInitial(true);
    try {
      const res = await freelancerService.getInspectionDetails(editingId);
      if (res.success && res.data) {
        const v = res.data.vehicleDetails || {};
        setFormData({
          customerName: v.customerName || "",
          customerMobileNumber: v.customerMobileNumber || "",
          registrationNumber: v.vehicleNumber || "",
          brand: v.brand || "",
          model: v.model || "",
          variant: v.variant || "",
          manufacturingYear: v.manufacturingYear ? v.manufacturingYear.toString() : "",
          registrationYear: v.registrationYear ? v.registrationYear.toString() : "",
          fuelType: v.fuelType || "Petrol",
          transmission: v.transmission || "Manual (MT)",
          odometerReading: v.odometerReading ? v.odometerReading.toString() : "",
          ownerProfileStatus: v.ownerName || "1st Owner",
          insuranceValidity: v.insuranceStatus || "",
          price: v.suggestedPrice ? v.suggestedPrice.toString() : "",
          location: v.location || "",
          underHypothecation: v.underHypothecation || "",
          accidental: v.accidental || "No",
          rtoInformation: v.rtoInformation || "",
        });

        const loadedPhotoMap: Record<string, { preview: string }> = {};
        let foundVideo: { name: string; previewUrl: string } | null = null;
        
        if (res.data.videoUrl) {
          foundVideo = { name: "Walkaround Video", previewUrl: resolveMediaUrl(res.data.videoUrl) || "" };
        } else if (res.data.inspectionVideos && Array.isArray(res.data.inspectionVideos)) {
          const vid = res.data.inspectionVideos.find((item: any) => item.videoUrl && item.captured !== false);
          if (vid) {
            foundVideo = { name: vid.displayName || "Walkaround Video", previewUrl: resolveMediaUrl(vid.videoUrl) || "" };
          }
        }

        const rawPhotos = res.data.inspectionPhotos || res.data.photos || [];
        if (Array.isArray(rawPhotos)) {
          rawPhotos.forEach((item: any) => {
            const cat = item.imageCategory || item.displayName || item.photoType || "";
            const url = resolveMediaUrl(item.imageUrl || (typeof item === "string" ? item : ""));
            if (!url) return;

            const lowerUrl = url.toLowerCase();
            const isVid = cat === "Engine / Motor Noise" || cat.toLowerCase().includes("video") || /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);
            
            if (isVid) {
              if (!foundVideo) {
                foundVideo = { name: "Walkaround Video", previewUrl: url };
              }
            } else {
              const matchedSlot = PHOTO_SLOTS.find(
                (slot) => slot.toLowerCase() === cat.toLowerCase() || cat.toLowerCase().includes(slot.toLowerCase())
              ) || cat;
              if (matchedSlot) {
                loadedPhotoMap[matchedSlot] = { preview: url };
              }
            }
          });
        }
        setPhotoMap(loadedPhotoMap);
        if (foundVideo) {
          setVideo(foundVideo);
        }
      }
    } catch (e: any) {
      showToast({ message: "Could not load vehicle details.", type: "error" });
    } finally {
      setLoadingInitial(false);
    }
  }, [editingId, showToast]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      const payload = {
        vehicleDetails: {
          customerName: formData.customerName,
          customerMobileNumber: formData.customerMobileNumber,
          vehicleNumber: formData.registrationNumber,
          brand: formData.brand,
          model: formData.model,
          variant: formData.variant,
          manufacturingYear: formData.manufacturingYear,
          registrationYear: formData.registrationYear,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          odometerReading: formData.odometerReading,
          ownerName: formData.ownerProfileStatus,
          insuranceStatus: formData.insuranceValidity,
          suggestedPrice: formData.price,
          location: formData.location,
          underHypothecation: formData.underHypothecation,
          accidental: formData.accidental,
          rtoInformation: formData.rtoInformation,
        }
      };

      let currentId = editingId;
      if (!currentId) {
        const res = await freelancerService.saveDraft(payload);
        if (res.success && res.data) {
          currentId = res.data.inspectionId || res.data.id;
        } else {
          throw new Error("Failed to create draft");
        }
      } else {
        await freelancerService.updateDraft(currentId, payload);
      }

      // Upload photos
      const photoEntries = Object.entries(photoMap);
      for (const [slot, data] of photoEntries) {
        if (data.file) {
          await freelancerService.uploadImage(currentId, slot, {
            uri: data.file.uri,
            type: data.file.type,
            name: data.file.name,
          });
        }
      }
      
      // Upload video
      if (video?.file) {
        await freelancerService.uploadImage(currentId, "Walkaround Video", {
          uri: video.file.uri,
          type: video.file.type,
          name: video.file.name,
        });
      }

      showToast({ message: "Draft saved successfully", type: "success" });
      navigation.goBack();
    } catch (err) {
      showToast({ message: "Error saving draft", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (!validateStep(step)) return;
    
    // Auto save draft silently
    try {
      setSubmitting(true);
      const payload = {
        vehicleDetails: {
          customerName: formData.customerName,
          customerMobileNumber: formData.customerMobileNumber,
          vehicleNumber: formData.registrationNumber,
          brand: formData.brand,
          model: formData.model,
          variant: formData.variant,
          manufacturingYear: formData.manufacturingYear,
          registrationYear: formData.registrationYear,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          odometerReading: formData.odometerReading,
          ownerName: formData.ownerProfileStatus,
          insuranceStatus: formData.insuranceValidity,
          suggestedPrice: formData.price,
          location: formData.location,
          underHypothecation: formData.underHypothecation,
          accidental: formData.accidental,
          rtoInformation: formData.rtoInformation,
        }
      };

      if (!editingId) {
        const res = await freelancerService.saveDraft(payload);
        if (res.success && res.data) {
          // Since we can't easily update editingId in this flow without refactoring route params,
          // we just continue. In a real app we'd set the ID state.
        }
      } else {
        await freelancerService.updateDraft(editingId, payload);
      }
    } catch (e) {
      console.warn('Silent save failed', e);
    } finally {
      setSubmitting(false);
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    try {
      setSubmitting(true);
      await handleSaveDraft(); // save everything first
      
      if (editingId) {
        const res = await freelancerService.submitReport(editingId);
        if (res.success) {
          showToast({ message: "Vehicle submitted for approval!", type: "success" });
          navigation.goBack();
        } else {
          showToast({ message: res.message || "Failed to submit vehicle", type: "error" });
        }
      } else {
          showToast({ message: "Draft saved. Please edit again to submit.", type: "success" });
          navigation.goBack();
      }
    } catch (err) {
      showToast({ message: "Error submitting vehicle", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickImage = async (clickedSlot: string) => {
    try {
      const picked = await pick({ mode: 'open', type: [types.images], allowMultiSelection: true });
      if (picked && picked.length > 0) {
        setPhotoMap((prev) => {
          const newMap = { ...prev };
          let pickIndex = 0;
          
          // Assign first picked image to the explicitly clicked slot
          newMap[clickedSlot] = { preview: picked[pickIndex].uri, file: picked[pickIndex] };
          pickIndex++;

          // For remaining picked images, fill the next available empty slots sequentially
          for (const slot of PHOTO_SLOTS) {
            if (pickIndex >= picked.length) break;
            if (!newMap[slot]) {
              newMap[slot] = { preview: picked[pickIndex].uri, file: picked[pickIndex] };
              pickIndex++;
            }
          }
          return newMap;
        });
      }
    } catch (err) {
      // ignore user cancel
    }
  };

  const handlePickVideo = async () => {
    try {
      const picked = await pick({ mode: 'open', type: [types.video] });
      if (picked && picked.length > 0) {
        const file = picked[0];
        setVideo({
          name: "Walkaround Video",
          previewUrl: file.uri,
          file: file,
        });
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {editingId ? 'Edit Vehicle Submission' : 'Add Vehicle'}
        </Text>
      </View>

      {/* Stepper */}
      <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.stepperLineContainer}>
          <View style={[styles.stepperLine, { backgroundColor: step >= 1 ? '#FFC700' : colors.border }]} />
        </View>
        <View style={styles.stepperRow}>
          {[0, 1].map((idx) => {
            const isActive = step === idx;
            const isCompleted = step > idx;
            return (
              <View key={idx} style={styles.stepperNode}>
                <View
                  style={[
                    styles.stepperCircle,
                    isActive ? { backgroundColor: '#FFC700', borderColor: '#FFC700' } :
                    isCompleted ? { backgroundColor: '#10B981', borderColor: '#10B981' } :
                    { backgroundColor: isDark ? '#171A24' : '#F8FAFC', borderColor: colors.border }
                  ]}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepperText, { color: isActive ? '#000' : colors.mutedForeground }]}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepperLabel, { color: isActive || isCompleted ? colors.foreground : colors.mutedForeground }]}>
                  {idx === 0 ? 'Details' : 'Photos'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {loadingInitial ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFC700" />
          <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading draft...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{freelancerSteps[step].title}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>{freelancerSteps[step].subtitle}</Text>
          </View>

          {step === 0 && (<View style={{ gap: 16 }}>
<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Customer Name</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.customerName ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="Enter owner name"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.customerName}
    onChangeText={(val) => handleInputChange('customerName', val)}
  />
  {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Customer Mobile Number</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.customerMobileNumber ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="Enter 10-digit number"
    keyboardType="phone-pad"
    maxLength={10}
    placeholderTextColor={colors.mutedForeground}
    value={formData.customerMobileNumber}
    onChangeText={(val) => {
      const numeric = val.replace(/\D/g, "");
      handleInputChange('customerMobileNumber', numeric);
    }}
  />
  {errors.customerMobileNumber && <Text style={styles.errorText}>{errors.customerMobileNumber}</Text>}
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Registration Number (RTO)</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.registrationNumber ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. MH01AB1234"
    
    autoCapitalize="characters"
    placeholderTextColor={colors.mutedForeground}
    value={formData.registrationNumber}
    onChangeText={(val) => handleInputChange('registrationNumber', val.toUpperCase())}
  />
  {errors.registrationNumber && <Text style={styles.errorText}>{errors.registrationNumber}</Text>}
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Brand / Make</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.brand ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. Honda"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.brand}
    onChangeText={(val) => handleInputChange('brand', val)}
  />
  {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
</View>

<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Model</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.model ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. City"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.model}
    onChangeText={(val) => handleInputChange('model', val)}
  />
  {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
</View>
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Variant</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.variant ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. ZX CVT"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.variant}
    onChangeText={(val) => handleInputChange('variant', val)}
  />
  {errors.variant && <Text style={styles.errorText}>{errors.variant}</Text>}
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Year</Text>
  <CustomSelect
    label="Year"
    value={formData.manufacturingYear}
    options={yearOptions}
    onSelect={(v: string) => handleInputChange('manufacturingYear', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.manufacturingYear}
  />
  {errors.manufacturingYear && <Text style={styles.errorText}>{errors.manufacturingYear}</Text>}
</View>

<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Registration Year</Text>
  <CustomSelect
    label="Registration Year"
    value={formData.registrationYear}
    options={yearOptions}
    onSelect={(v: string) => handleInputChange('registrationYear', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.registrationYear}
  />
  {errors.registrationYear && <Text style={styles.errorText}>{errors.registrationYear}</Text>}
</View>
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Fuel Type</Text>
  <CustomSelect
    label="Fuel Type"
    value={formData.fuelType}
    options={fuelTypeOptions}
    onSelect={(v: string) => handleInputChange('fuelType', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.fuelType}
  />
  {errors.fuelType && <Text style={styles.errorText}>{errors.fuelType}</Text>}
</View>

<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Transmission</Text>
  <CustomSelect
    label="Transmission"
    value={formData.transmission}
    options={transmissionOptions}
    onSelect={(v: string) => handleInputChange('transmission', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.transmission}
  />
  {errors.transmission && <Text style={styles.errorText}>{errors.transmission}</Text>}
</View>
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Odometer Reading (km)</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.odometerReading ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. 45000"
    keyboardType="number-pad"
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.odometerReading}
    onChangeText={(val) => handleInputChange('odometerReading', val)}
  />
  {errors.odometerReading && <Text style={styles.errorText}>{errors.odometerReading}</Text>}
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Owner Profile</Text>
  <CustomSelect
    label="Owner Profile"
    value={formData.ownerProfileStatus}
    options={ownerProfileStatusOptions}
    onSelect={(v: string) => handleInputChange('ownerProfileStatus', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.ownerProfileStatus}
  />
  {errors.ownerProfileStatus && <Text style={styles.errorText}>{errors.ownerProfileStatus}</Text>}
</View>

<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Insurance Status</Text>
  <CustomSelect
    label="Insurance Type"
    value={formData.insuranceValidity}
    options={["Valid (Comprehensive)", "Valid (Third Party)", "Expired", "No Insurance"]}
    onSelect={(v: string) => handleInputChange('insuranceValidity', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.insuranceValidity}
  />
  {errors.insuranceValidity && <Text style={styles.errorText}>{errors.insuranceValidity}</Text>}
</View>
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Expected Price / Suggested Price</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.price ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. 500000"
    keyboardType="number-pad"
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.price}
    onChangeText={(val) => handleInputChange('price', val)}
  />
  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Location</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.location ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. Mumbai, Borivali West"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.location}
    onChangeText={(val) => handleInputChange('location', val)}
  />
  {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Under Hypothecation</Text>
  <CustomSelect
    label="Under Hypothecation"
    value={formData.underHypothecation}
    options={["Yes", "No", "N/A"]}
    onSelect={(v: string) => handleInputChange('underHypothecation', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.underHypothecation}
  />
  {errors.underHypothecation && <Text style={styles.errorText}>{errors.underHypothecation}</Text>}
</View>

<View style={[styles.fieldBlock, { flex: 1 }]}>
  <Text style={[styles.label, { color: colors.foreground }]}>Accidental Status</Text>
  <CustomSelect
    label="Accidental Status"
    value={formData.accidental}
    options={["No", "Yes"]}
    onSelect={(v: string) => handleInputChange('accidental', v)}
    colors={colors}
    isDark={isDark}
    hasError={!!errors.accidental}
  />
  {errors.accidental && <Text style={styles.errorText}>{errors.accidental}</Text>}
</View>
</View>

<View style={[styles.fieldBlock]}>
  <Text style={[styles.label, { color: colors.foreground }]}>RTO Information</Text>
  <TextInput
    style={[styles.input, { borderColor: errors.rtoInformation ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', color: colors.foreground }]}
    placeholder="e.g. MH-01 Mumbai Tardeo"
    
    
    placeholderTextColor={colors.mutedForeground}
    value={formData.rtoInformation}
    onChangeText={(val) => handleInputChange('rtoInformation', val)}
  />
  {errors.rtoInformation && <Text style={styles.errorText}>{errors.rtoInformation}</Text>}
</View>
</View>)}

          {step === 1 && (
            <View style={{ gap: 16 }}>
              {errors.photos && <Text style={[styles.errorText, { fontSize: 14, marginBottom: -8 }]}>{errors.photos}</Text>}
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vehicle Photos (10 slots)</Text>
              <View style={styles.photoGrid}>
                {PHOTO_SLOTS.map((slot) => {
                  const data = photoMap[slot];
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.photoCard, { borderColor: errors.photos && !data?.preview ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}
                      onPress={() => handlePickImage(slot)}
                      activeOpacity={0.8}
                    >
                      {data?.preview ? (
                        <>
                          <Image source={{ uri: data.preview }} style={styles.photoPreview} />
                          <View style={styles.photoBadge}>
                            <CheckCircle2 size={14} color="#FFF" />
                          </View>
                        </>
                      ) : (
                        <View style={styles.photoEmpty}>
                          <Camera size={24} color={errors.photos ? '#F43F5E' : colors.mutedForeground} />
                          <Text style={[styles.photoLabel, { color: errors.photos ? '#F43F5E' : colors.foreground }]}>{slot}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errors.video && <Text style={[styles.errorText, { fontSize: 14, marginTop: 8, marginBottom: -8 }]}>{errors.video}</Text>}
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 12 }]}>Walkaround Video (1 slot)</Text>
              
              {video?.previewUrl ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA', overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Video size={20} color="#FFC700" />
                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{video.name || 'Walkaround Video'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setVideo(null)}>
                      <Text style={{ color: '#F43F5E', fontWeight: '600', fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <RNVideo
                    source={{ uri: video.previewUrl }}
                    style={{ width: '100%', height: 240, backgroundColor: '#000' }}
                    controls={true}
                    resizeMode="contain"
                    paused={true}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.videoCard, { borderColor: errors.video ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}
                  onPress={handlePickVideo}
                  activeOpacity={0.8}
                >
                  <View style={styles.photoEmpty}>
                    <Video size={30} color={errors.video ? '#F43F5E' : colors.mutedForeground} />
                    <Text style={[styles.photoLabel, { color: errors.video ? '#F43F5E' : colors.foreground, marginTop: 8 }]}>Upload Walkaround Video</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

        </ScrollView>
      )}

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
        {step > 0 ? (
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.border }]}
            onPress={() => setStep(step - 1)}
            disabled={submitting}
          >
            <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.border }]}
            onPress={handleSaveDraft}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator size="small" color={colors.foreground} /> : <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>Save Draft</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
          onPress={() => {
            if (step < 1) handleNextStep();
            else handleSubmit();
          }}
          disabled={submitting}
        >
          {submitting && step === 1 ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>{step === 1 ? 'Submit Vehicle' : 'Next Step'}</Text>
              {step < 1 && <ChevronRight size={18} color="#0D0E12" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepperContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    position: 'relative',
  },
  stepperLineContainer: {
    position: 'absolute',
    top: 28,
    left: 50,
    right: 50,
    height: 2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  stepperLine: {
    flex: 1,
    height: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperNode: {
    alignItems: 'center',
    width: 60,
  },
  stepperCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 6,
    zIndex: 2,
  },
  stepperText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  selectBtn: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  selectValueText: {
    fontSize: 15,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  photoEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  photoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 2,
  },
  videoCard: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoName: {
    marginTop: 8,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFC700',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#0D0E12',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    width: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  pickerOptionText: {
    fontSize: 15,
  },
});
