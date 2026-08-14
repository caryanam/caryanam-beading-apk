import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Navigation,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { dealerService } from '../services/dealerService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { DealerNotificationsModal } from '../components/DealerNotificationsModal';

interface DealerProfileScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const DealerProfileScreen: React.FC<DealerProfileScreenProps> = ({ navigation: _navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dealershipName, setDealershipName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Pune');

  // Change password modal state
  const [showPassModal, setShowPassModal] = useState(false);
  const [passStep, setPassStep] = useState<1 | 2 | 3>(1);
  const [passOtpInput, setPassOtpInput] = useState('');
  const [passOtpError, setPassOtpError] = useState<string | null>(null);
  const [passResendCooldown, setPassResendCooldown] = useState(0);
  const [sendingPassOtp, setSendingPassOtp] = useState(false);
  const [verifyingPassOtp, setVerifyingPassOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [showModalNewPass, setShowModalNewPass] = useState(false);
  const [showModalConfirmPass, setShowModalConfirmPass] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await dealerService.getProfile();
        if (res.success && res.data) {
          setDealershipName(res.data.dealershipName || '');
          setFullName(res.data.ownerName || '');
          setEmail(res.data.email || '');
          setMobileNumber(res.data.mobileNumber || '');
          setAddress(res.data.address || '');
          setArea(res.data.area || '');
          setCity(res.data.city || 'Pune');
        }
      } catch {
        const session = await authService.getStoredSession();
        if (session) {
          setEmail(session.email || '');
          setFullName(session.name || '');
          setDealershipName(session.dealershipName || '');
          setMobileNumber(session.mobileNumber || '');
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (passResendCooldown > 0) {
      const timer = setTimeout(() => setPassResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [passResendCooldown]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await dealerService.updateProfile({ dealershipName, fullName, mobileNumber, address, area, city });
      if (res.success) {
        showToast({ message: 'Dealership profile updated successfully.', type: 'success' });
      } else {
        showToast({ message: res.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err: any) {
      showToast({
        message: err.response?.data?.message || 'Failed to update profile settings.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setPassStep(1);
    setPassOtpInput('');
    setPassOtpError(null);
    setModalNewPassword('');
    setModalConfirmPassword('');
    setShowPassModal(true);
  };

  const handleStep1SendOtp = async () => {
    if (!email) {
      setPassOtpError('Email address is missing.');
      return;
    }
    setSendingPassOtp(true);
    setPassOtpError(null);
    try {
      await authService.sendPasswordOtp(email);
      setPassResendCooldown(60);
      setPassStep(2);
    } catch (err: any) {
      setPassOtpError(err.message || 'Failed to send verification OTP.');
    } finally {
      setSendingPassOtp(false);
    }
  };

  const handleStep2VerifyOtp = async () => {
    if (!passOtpInput || passOtpInput.trim().length !== 6) {
      setPassOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setVerifyingPassOtp(true);
    setPassOtpError(null);
    try {
      const isSuccess = await authService.verifyOtp(email, passOtpInput.trim());
      if (!isSuccess) {
        setPassOtpError('Invalid or expired OTP code. Please try again.');
        return;
      }
      showToast({ message: 'OTP verified successfully! Now set your new password.', type: 'success' });
      setPassStep(3);
    } catch (err: any) {
      setPassOtpError(err.message || 'OTP verification failed.');
    } finally {
      setVerifyingPassOtp(false);
    }
  };

  const handleResendPassOtp = async () => {
    if (passResendCooldown > 0) return;
    setSendingPassOtp(true);
    setPassOtpError(null);
    try {
      await authService.sendPasswordOtp(email);
      setPassResendCooldown(60);
      showToast({ message: 'A new 6-digit OTP code has been sent to your email!', type: 'success' });
    } catch (err: any) {
      setPassOtpError(err.message || 'Failed to resend OTP.');
    } finally {
      setSendingPassOtp(false);
    }
  };

  const handleStep3UpdatePassword = async () => {
    if (!modalNewPassword || modalNewPassword.trim().length < 6) {
      setPassOtpError('New password must be at least 6 characters long.');
      return;
    }
    if (modalNewPassword !== modalConfirmPassword) {
      setPassOtpError('New password and confirm password do not match.');
      return;
    }
    setUpdatingPassword(true);
    setPassOtpError(null);
    try {
      const passRes = await dealerService.changePassword({ newPassword: modalNewPassword });
      if (passRes.success) {
        showToast({ message: 'Password updated successfully!', type: 'success' });
        setShowPassModal(false);
      } else {
        setPassOtpError(passRes.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setPassOtpError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const initials = (dealershipName || fullName || 'U').slice(0, 2).toUpperCase();

  const inputStyle = (editable: boolean) => [
    styles.inputField,
    {
      backgroundColor: editable ? (isDark ? '#171A24' : '#FFFFFF') : 'rgba(148,163,184,0.1)',
      borderColor: colors.border,
      color: editable ? colors.foreground : colors.mutedForeground,
    },
  ];

  const inputLabel = (text: string, required = false) => (
    <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
      {text} {required && <Text style={{ color: '#FFC700' }}>*</Text>}
    </Text>
  );

  const renderStepPills = () => (
    <View style={styles.stepPillsRow}>
      {['Request OTP', 'Verify OTP', 'Reset'].map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const active = passStep === stepNum;
        return (
          <View
            key={i}
            style={[
              styles.stepPill,
              { backgroundColor: active ? '#FFC700' : 'rgba(255,255,255,0.1)' },
            ]}
          >
            <Text style={[styles.stepPillText, { color: active ? '#0D0E12' : '#A1A1AA' }]}>
              Step {i + 1}: {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const darkInput = (placeholder: string, value: string, onChange: (t: string) => void, secure = false, showToggle = false, onToggle?: () => void) => (
    <View style={styles.darkInputWrap}>
      <TextInput
        style={styles.darkInputField}
        placeholder={placeholder}
        placeholderTextColor="#71717A"
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure && !showToggle}
      />
      {onToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.darkInputToggle}>
          {showToggle ? <EyeOff size={16} color="#A1A1AA" /> : <Eye size={16} color="#A1A1AA" />}
        </TouchableOpacity>
      )}
    </View>
  );

  const modalPrimaryBtn = (busy: boolean, onPress: () => void, label: string) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      style={[styles.modalPrimaryBtn, busy && { opacity: 0.6 }]}
      activeOpacity={0.85}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#0D0E12" />
      ) : (
        <Text style={styles.modalPrimaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <User size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile & Settings</Text>
        </View>
        <View style={styles.headerRightActions}>
          <DealerNotificationsModal navigation={_navigation} iconColor={colors.foreground} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentBody}>
            {/* Luxury banner */}
            <View style={styles.banner}>
              <View style={styles.bannerGlow} />
              <View style={styles.bannerContent}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.verifiedDot}>
                    <CheckCircle2 size={14} color="#10B981" />
                  </View>
                </View>
                <View style={styles.bannerInfo}>
                  <View style={styles.bannerTitleRow}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {dealershipName || fullName || 'User Profile'}
                    </Text>
                    <View style={styles.rolePill}>
                      <Sparkles size={10} color="#FFC700" />
                      <Text style={styles.rolePillText}>DEALER</Text>
                    </View>
                  </View>
                  <Text style={styles.bannerMail}>
                    <Mail size={11} color="#FFC700" /> {email || '—'}
                  </Text>
                  {fullName ? (
                    <Text style={styles.bannerOwner}>
                      <User size={11} color="#FFC700" /> Owner: {fullName}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Dealership information */}
            <View style={[styles.panel, { backgroundColor: isDark ? '#12141C' : '#FFFFFF', borderColor: colors.border }]}>
              <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.panelHeaderTop}>
                  <View style={styles.panelHeaderIcon}>
                    <Building2 size={16} color="#FFC700" />
                  </View>
                  <View style={styles.panelHeaderTitleWrap}>
                    <Text style={[styles.panelHeaderTitle, { color: colors.foreground }]}>Dealership Information</Text>
                    <Text style={[styles.panelHeaderSub, { color: colors.mutedForeground }]}>
                      Manage your dealership profile and contact details
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changePassBtn}
                  onPress={handleOpenPasswordModal}
                  activeOpacity={0.85}
                >
                  <KeyRound size={14} color="#FFC700" />
                  <Text style={styles.changePassBtnText}>Change Password</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGrid}>
                {inputLabel('Dealership / Shop Name', true)}
                <View style={styles.inputWrap}>
                  <Building2 size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={inputStyle(true)}
                    placeholder="Dealership Name"
                    placeholderTextColor={colors.mutedForeground}
                    value={dealershipName}
                    onChangeText={setDealershipName}
                  />
                </View>

                {inputLabel('Owner Name', true)}
                <View style={styles.inputWrap}>
                  <User size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={inputStyle(true)}
                    placeholder="Owner Name"
                    placeholderTextColor={colors.mutedForeground}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.labelRow}>
                  {inputLabel('Email Address', true)}
                  <View style={styles.readOnlyPill}>
                    <Text style={styles.readOnlyPillText}>Read-only</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Mail size={14} color={colors.mutedForeground} />
                  <TextInput style={inputStyle(false)} value={email} editable={false} />
                </View>

                <View style={styles.labelRow}>
                  {inputLabel('Mobile Number', true)}
                  <View style={styles.readOnlyPill}>
                    <Text style={styles.readOnlyPillText}>Locked</Text>
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <Phone size={14} color={colors.mutedForeground} />
                  <TextInput style={inputStyle(false)} value={mobileNumber} editable={false} />
                </View>

                {inputLabel('Address', true)}
                <View style={styles.inputWrap}>
                  <Home size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={inputStyle(true)}
                    placeholder="Dealership Address"
                    placeholderTextColor={colors.mutedForeground}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                {inputLabel('Area', true)}
                <View style={styles.inputWrap}>
                  <Navigation size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={inputStyle(true)}
                    placeholder="Area / Locality"
                    placeholderTextColor={colors.mutedForeground}
                    value={area}
                    onChangeText={setArea}
                  />
                </View>

                {inputLabel('City', true)}
                <View style={styles.inputWrap}>
                  <MapPin size={14} color={colors.mutedForeground} />
                  <TextInput
                    style={inputStyle(true)}
                    placeholder="City"
                    placeholderTextColor={colors.mutedForeground}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              <View style={styles.saveRow}>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSaveChanges}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#0D0E12" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Profile Details</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Change password modal */}
      <Modal visible={showPassModal} transparent animationType="fade" onRequestClose={() => setShowPassModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPassModal(false)}>
              <X size={18} color="#A1A1AA" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <KeyRound size={22} color="#FFC700" />
              </View>
              <Text style={styles.modalTitle}>
                {passStep === 1 && 'Change Password'}
                {passStep === 2 && 'Enter Verification OTP'}
                {passStep === 3 && 'Set New Password'}
              </Text>
              {renderStepPills()}
            </View>

            {passOtpError && (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{passOtpError}</Text>
              </View>
            )}

            {passStep === 1 && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  We will send a 6-digit OTP verification code to your registered email address below:
                </Text>
                {inputLabel('Registered Email Address')}
                <View style={styles.darkInputWrap}>
                  <Mail size={14} color="#FFC700" />
                  <TextInput style={styles.darkInputField} value={email} editable={false} />
                </View>
                {modalPrimaryBtn(sendingPassOtp, handleStep1SendOtp, 'Send Verification OTP')}
              </View>
            )}

            {passStep === 2 && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  We've sent a 6-digit verification code to:
                  {'\n'}
                  <Text style={styles.modalEmail}>{email}</Text>
                </Text>
                {inputLabel('Enter 6-Digit OTP Code')}
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#3F3F46"
                  maxLength={6}
                  keyboardType="number-pad"
                  value={passOtpInput}
                  onChangeText={(t) => {
                    setPassOtpInput(t.replace(/\D/g, '').slice(0, 6));
                    if (passOtpError) setPassOtpError(null);
                  }}
                />
                {modalPrimaryBtn(verifyingPassOtp || passOtpInput.length !== 6, handleStep2VerifyOtp, 'Verify OTP Code')}
                <View style={styles.resendRow}>
                  <Text style={styles.resendHint}>Didn't receive the email?</Text>
                  <TouchableOpacity
                    onPress={handleResendPassOtp}
                    disabled={passResendCooldown > 0 || sendingPassOtp}
                    style={styles.resendBtn}
                  >
                    {sendingPassOtp ? (
                      <Text style={styles.resendBtnText}>Sending...</Text>
                    ) : passResendCooldown > 0 ? (
                      <Text style={styles.resendBtnTextMuted}>Resend OTP in {passResendCooldown}s</Text>
                    ) : (
                      <View style={styles.resendBtnInner}>
                        <RefreshCw size={11} color="#FFC700" />
                        <Text style={styles.resendBtnText}>Resend OTP</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {passStep === 3 && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: '#34D399', textAlign: 'center' }]}>
                  <CheckCircle2 size={12} color="#34D399" /> Identity Verified! Set your new password:
                </Text>
                {inputLabel('New Password', true)}
                {darkInput('Min 6 characters', modalNewPassword, setModalNewPassword, true, showModalNewPass, () => setShowModalNewPass((s) => !s))}
                {inputLabel('Confirm New Password', true)}
                {darkInput('Re-enter new password', modalConfirmPassword, setModalConfirmPassword, true, showModalConfirmPass, () => setShowModalConfirmPass((s) => !s))}
                {modalPrimaryBtn(
                  updatingPassword || !modalNewPassword || !modalConfirmPassword,
                  handleStep3UpdatePassword,
                  'Update Password',
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  contentBody: { padding: 16, gap: 18, paddingBottom: 40 },

  banner: { backgroundColor: '#0D0E12', borderWidth: 1, borderColor: 'rgba(255,199,0,0.25)', borderRadius: 24, padding: 20, overflow: 'hidden' },
  bannerGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,199,0,0.1)' },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 18, backgroundColor: '#FFC700', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#0D0E12' },
  verifiedDot: { position: 'absolute', bottom: -3, right: -3, backgroundColor: '#0D0E12', borderRadius: 10, padding: 1.5 },
  bannerInfo: { flex: 1 },
  bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bannerTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  rolePillText: { fontSize: 8.5, fontWeight: '900', color: '#FFC700', letterSpacing: 0.4 },
  bannerMail: { fontSize: 11, fontWeight: '700', color: '#A1A1AA', marginTop: 6 },
  bannerOwner: { fontSize: 11, fontWeight: '800', color: '#D4D4D8', marginTop: 4 },

  panel: { borderWidth: 1, borderRadius: 22, padding: 18 },
  panelHeader: { borderBottomWidth: 1, paddingBottom: 14 },
  panelHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelHeaderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,199,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  panelHeaderTitleWrap: { flex: 1 },
  panelHeaderTitle: { fontSize: 14, fontWeight: '900' },
  panelHeaderSub: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  changePassBtn: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D0E12', borderWidth: 1, borderColor: 'rgba(255,199,0,0.4)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
  changePassBtnText: { fontSize: 10.5, fontWeight: '900', color: '#FFC700' },

  formGrid: { marginTop: 16, gap: 10 },
  inputLabel: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readOnlyPill: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 6 },
  readOnlyPillText: { fontSize: 8.5, fontWeight: '900', color: '#D97706' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputField: { flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 13, fontWeight: '700' },

  saveRow: { alignItems: 'flex-end', marginTop: 6 },
  saveBtn: { backgroundColor: '#FFC700', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14, minWidth: 170, alignItems: 'center' },
  saveBtnText: { fontSize: 12, fontWeight: '900', color: '#0D0E12' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0D0E12', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', borderRadius: 24, padding: 20 },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  modalHeader: { alignItems: 'center', marginBottom: 8 },
  modalHeaderIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,199,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  stepPillsRow: { flexDirection: 'row', gap: 5, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  stepPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stepPillText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },

  modalError: { backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  modalErrorText: { fontSize: 11, fontWeight: '700', color: '#FB7185', textAlign: 'center' },
  modalBody: { marginTop: 16, gap: 8 },
  modalDesc: { fontSize: 11.5, fontWeight: '600', color: '#A1A1AA', lineHeight: 17, marginBottom: 6 },
  modalEmail: { fontSize: 13, fontWeight: '800', color: '#FFC700' },
  darkInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16181F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 14 },
  darkInputField: { flex: 1, color: '#FFFFFF', paddingVertical: 13, fontSize: 13, fontWeight: '700', paddingHorizontal: 0 },
  darkInputToggle: { padding: 4 },
  otpInput: { backgroundColor: '#16181F', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)', borderRadius: 14, paddingVertical: 14, fontSize: 22, fontWeight: '900', color: '#FFC700', textAlign: 'center', letterSpacing: 8 },
  modalPrimaryBtn: { backgroundColor: '#FFC700', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  modalPrimaryBtnText: { fontSize: 11, fontWeight: '900', color: '#0D0E12', textTransform: 'uppercase', letterSpacing: 0.5 },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  resendHint: { fontSize: 11, fontWeight: '600', color: '#71717A' },
  resendBtn: { paddingVertical: 4 },
  resendBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resendBtnText: { fontSize: 11, fontWeight: '800', color: '#FFC700' },
  resendBtnTextMuted: { fontSize: 11, fontWeight: '800', color: '#71717A' },
});