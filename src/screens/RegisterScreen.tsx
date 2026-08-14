import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Mail, X, Eye, EyeOff, ArrowLeft, Building2, User, Lock, MapPin, Phone } from 'lucide-react-native';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const [role, setRole] = useState<'dealer' | 'inspector'>('dealer');
  const [dealershipName, setDealershipName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleMobileChange = (v: string) => {
    const numeric = v.replace(/\D/g, "");
    if (numeric.length > 0) {
      const cleaned = numeric.replace(/^[0-5]+/, "");
      setMobile(cleaned.slice(0, 10));
    } else {
      setMobile("");
    }
  };

  const handleRegisterPress = async () => {
    // 1. Validations matching Web exactly
    if (role === 'dealer') {
      if (!dealershipName.trim()) {
        showToast({ message: 'Dealership / Shop Name is required.', type: 'warning' });
        return;
      }
      if (!ownerName.trim()) {
        showToast({ message: 'Owner Name is required.', type: 'warning' });
        return;
      }
      if (!email.trim()) {
        showToast({ message: 'Email Address is required.', type: 'warning' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showToast({ message: 'Please enter a valid email address.', type: 'warning' });
        return;
      }
      if (!mobile.trim()) {
        showToast({ message: 'Mobile Number is required.', type: 'warning' });
        return;
      }
      if (!/^[6-9][0-9]{9}$/.test(mobile.trim())) {
        showToast({ message: 'Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.', type: 'warning' });
        return;
      }
      if (!password) {
        showToast({ message: 'Account Password is required.', type: 'warning' });
        return;
      }
      if (!address.trim() || address.trim().length < 5) {
        showToast({ message: 'Address must be at least 5 characters long.', type: 'warning' });
        return;
      }
      if (!area.trim() || area.trim().length < 3) {
        showToast({ message: 'Area must be at least 3 characters long.', type: 'warning' });
        return;
      }
      if (!city.trim() || city.trim().length < 3) {
        showToast({ message: 'City must be at least 3 characters long.', type: 'warning' });
        return;
      }
    } else {
      if (!ownerName.trim()) {
        showToast({ message: 'Full Name is required.', type: 'warning' });
        return;
      }
      if (!email.trim()) {
        showToast({ message: 'Email Address is required.', type: 'warning' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showToast({ message: 'Please enter a valid email address.', type: 'warning' });
        return;
      }
      if (!mobile.trim()) {
        showToast({ message: 'Mobile Number is required.', type: 'warning' });
        return;
      }
      if (!/^[6-9][0-9]{9}$/.test(mobile.trim())) {
        showToast({ message: 'Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.', type: 'warning' });
        return;
      }
      if (!password) {
        showToast({ message: 'Account Password is required.', type: 'warning' });
        return;
      }
    }

    // 2. Trigger OTP Code Dispatch
    setSendingOtp(true);
    setLoading(true);
    try {
      await authService.sendOtp(email.trim(), mobile.trim());
      setOtpInput('');
      setOtpError(null);
      setShowOtpModal(true);
      setResendCooldown(60);
      showToast({ message: 'Verification OTP sent successfully.', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Error occurred while sending verification code.', type: 'error' });
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setSendingOtp(true);
    setOtpError(null);
    try {
      await authService.sendOtp(email.trim(), mobile.trim());
      setResendCooldown(60);
      showToast({ message: 'A new OTP code has been sent to your email!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Could not resend OTP.', type: 'error' });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const isSuccess = await authService.verifyOtp(email.trim(), otpInput.trim());
      if (!isSuccess) {
        setOtpError('Invalid or expired OTP. Please check your email and try again.');
        return;
      }

      if (role === 'dealer') {
        await authService.registerDealer({
          dealershipName: dealershipName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password: password,
          address: address.trim(),
          area: area.trim(),
          city: city.trim(),
        });
      } else {
        await authService.registerInspector({
          fullName: ownerName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password: password,
        });
      }

      showToast({ message: 'Registration completed successfully! Please sign in.', type: 'success' });
      setShowOtpModal(false);
      
      // Clear form inputs
      setDealershipName('');
      setOwnerName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setAddress('');
      setCity('');
      setArea('');
      
      navigation.navigate('Login');
    } catch (err: any) {
      setOtpError(err.message || 'Registration failed.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const inputBg = theme === 'dark' ? colors.secondary : '#F1F3F6';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: Platform.OS === 'ios' ? 54 : 44 }]}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.7}
      >
        <ArrowLeft size={16} color="#FFC700" style={{ marginRight: 6 }} />
        <Text style={styles.backBtnText}>Back to Home</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top Hero Banner */}
        <View style={styles.heroBanner}>
          {/* Ambient Glow Circles */}
          <View style={styles.glowCircle1} />
          <View style={styles.glowCircle2} />

          <View style={styles.logoWrapper}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="cover" />
            </View>
          </View>
          <Text style={styles.brandText}>CARYANAM</Text>
          <Text style={styles.brandSubtext}>B2B AUTOMOTIVE LIQUIDATION</Text>
        </View>

        {/* Floating Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: colors.foreground }]}>Sign Up</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Register for bidding opportunities
            </Text>
          </View>

          {/* Role Switcher */}
          <View style={[styles.roleTabs, { backgroundColor: inputBg, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'dealer' && styles.activeRoleTab]}
              onPress={() => {
                setRole('dealer');
                setOtpError(null);
              }}
            >
              <Text style={[styles.roleTabText, { color: colors.mutedForeground }, role === 'dealer' && styles.activeRoleTabText]}>
                Dealer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, role === 'inspector' && styles.activeRoleTab]}
              onPress={() => {
                setRole('inspector');
                setOtpError(null);
              }}
            >
              <Text style={[styles.roleTabText, { color: colors.mutedForeground }, role === 'inspector' && styles.activeRoleTabText]}>
                Inspector
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.fieldsContainer}>
            {role === 'dealer' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>DEALERSHIP / SHOP NAME *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                  <Building2 size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={dealershipName}
                    onChangeText={setDealershipName}
                    placeholder="Enter Dealership Name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {role === 'dealer' ? 'OWNER NAME *' : 'FULL NAME *'}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <User size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder={role === 'dealer' ? "Enter Owner Name" : "Enter Full Name"}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL ADDRESS *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <Mail size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter E-mail"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>MOBILE NUMBER *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <Phone size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={mobile}
                  onChangeText={handleMobileChange}
                  placeholder="Enter Mobile Number"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>ACCOUNT PASSWORD *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <Lock size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter Password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.togglePasswordBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#FFC700" />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {role === 'dealer' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>ADDRESS *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                    <MapPin size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Enter Address"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>AREA *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                    <MapPin size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={area}
                      onChangeText={setArea}
                      placeholder="Enter Area"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>CITY *</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                    <MapPin size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={city}
                      onChangeText={setCity}
                      placeholder="Enter City"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegisterPress}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0D0E12" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* OTP Verification Modal Dialogue */}
      <Modal transparent visible={showOtpModal} animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setShowOtpModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.modalContainer, { backgroundColor: '#0D0E12', borderColor: 'rgba(255,199,0,0.3)' }]}>
            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowOtpModal(false)} activeOpacity={0.7}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Header Icon */}
            <View style={styles.otpHeaderRow}>
              <View style={styles.otpIconBg}>
                <Mail size={32} color="#FFC700" />
              </View>
              <Text style={styles.modalTitle}>Verify Email Address</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit verification code to:
              </Text>
              <Text style={styles.modalEmailText}>{email}</Text>
            </View>

            {/* Input Box */}
            <View style={styles.otpInputGroup}>
              <Text style={styles.otpInputLabel}>Enter 6-Digit OTP Code</Text>
              <TextInput
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otpInput}
                onChangeText={(v) => {
                  setOtpInput(v.replace(/\D/g, "").slice(0, 6));
                  if (otpError) setOtpError(null);
                }}
                placeholder="0 0 0 0 0 0"
                placeholderTextColor="#27272A"
                autoFocus
              />
            </View>

            {/* Error Message */}
            {otpError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{otpError}</Text>
              </View>
            )}

            {/* Cooldown Text */}
            <View style={styles.cooldownContainer}>
              {resendCooldown > 0 ? (
                <Text style={styles.resendCooldownText}>
                  Resend OTP in {resendCooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={sendingOtp}>
                  <Text style={styles.resendBtnText}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verification Button */}
            <TouchableOpacity
              style={[styles.verifyBtn, verifyingOtp && { opacity: 0.7 }]}
              onPress={handleVerifyAndRegister}
              disabled={verifyingOtp}
              activeOpacity={0.85}
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#0D0E12" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify & Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 18, 0.75)',
    borderColor: 'rgba(255, 199, 0, 0.35)',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBanner: {
    height: 290,
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 45,
  },
  glowCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -65,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 199, 0, 0.1)',
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  brandSubtext: {
    fontSize: 8.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: -30,
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  roleTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeRoleTab: {
    backgroundColor: '#FFC700',
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeRoleTabText: {
    color: '#0D0E12',
    fontWeight: '800',
  },
  fieldsContainer: {
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  togglePasswordBtn: {
    paddingHorizontal: 14,
  },
  registerBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  registerBtnText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginLink: {
    color: '#FFC700',
    fontSize: 13,
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 4,
  },
  otpHeaderRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalEmailText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFC700',
    marginTop: 4,
    textAlign: 'center',
  },
  otpInputGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpInputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  otpInput: {
    width: '100%',
    backgroundColor: '#16181F',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.25)',
    borderRadius: 16,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '900',
    color: '#FFC700',
    letterSpacing: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cooldownContainer: {
    marginBottom: 24,
  },
  resendCooldownText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resendBtnText: {
    fontSize: 12,
    color: '#FFC700',
    fontWeight: '800',
  },
  verifyBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  verifyBtnText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
