import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound, X, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [modalAlert, setModalAlert] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);

  const notifyModal = (message: string, type: 'error' | 'success' | 'warning') => {
    setModalAlert({ message, type });
    showToast({ message, type });
  };

  const handleEmailOrMobileChange = (v: string) => {
    if (/[a-zA-Z@]/.test(v)) {
      setEmail(v);
      return;
    }
    const numeric = v.replace(/\D/g, "");
    if (numeric.length > 0) {
      const cleaned = numeric.replace(/^[0-5]+/, "");
      setEmail(cleaned.slice(0, 10));
    } else {
      setEmail("");
    }
  };

  const handleLogin = async () => {
    const input = email.trim();
    if (!input) {
      showToast({ message: 'Email Address or Mobile Number is required.', type: 'warning' });
      return;
    }
    if (!password) {
      showToast({ message: 'Account Password is required.', type: 'warning' });
      return;
    }

    if (input.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        showToast({ message: 'Please enter a valid email address.', type: 'warning' });
        return;
      }
    } else {
      const mobileRegex = /^[6-9][0-9]{9}$/;
      if (!mobileRegex.test(input)) {
        showToast({ message: 'Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.', type: 'warning' });
        return;
      }
    }

    setLoading(true);
    try {
      const session = await authService.login(input, password);
      showToast({ message: `Welcome back, ${session.name}!`, type: 'success' });
      if (session.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (session.role === 'inspector') {
        navigation.navigate('InspectorDashboard');
      } else if (session.role === 'freelancer') {
        navigation.navigate('FreelancerDashboard');
      } else {
        navigation.navigate('DealerMarketplace');
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Invalid credentials.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setResetEmail(email.trim());
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
    setModalAlert(null);
    setForgotModalVisible(true);
  };

  // Step 1: Send OTP
  const handleSendResetOtp = async () => {
    const input = resetEmail.trim();
    if (!input) {
      notifyModal('Please enter your registered Email address.', 'warning');
      return;
    }

    setResetLoading(true);
    setModalAlert(null);
    try {
      await authService.sendPasswordOtp(input);
      notifyModal('Verification OTP sent to your email!', 'success');
      setForgotStep(2);
    } catch (err: any) {
      notifyModal(err.message || 'Failed to send OTP.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyResetOtp = async () => {
    const otp = resetOtp.trim();
    if (!otp) {
      notifyModal('Please enter the 6-digit OTP code.', 'warning');
      return;
    }

    setResetLoading(true);
    setModalAlert(null);
    try {
      const verified = await authService.verifyOtp(resetEmail.trim(), otp);
      if (verified) {
        notifyModal('OTP verified successfully! Set your new password.', 'success');
        setForgotStep(3);
      } else {
        notifyModal('Invalid or expired OTP code.', 'error');
      }
    } catch (err: any) {
      notifyModal(err.message || 'OTP verification failed.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword) {
      notifyModal('Please enter a new password.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      notifyModal('Password must be at least 6 characters long.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      notifyModal('Passwords do not match.', 'warning');
      return;
    }

    setResetLoading(true);
    setModalAlert(null);
    try {
      await authService.resetPassword(resetEmail.trim(), resetOtp.trim(), newPassword);
      setEmail(resetEmail.trim());
      setForgotModalVisible(false);
      setTimeout(() => {
        showToast({ message: 'Password reset successfully! Please sign in.', type: 'success' });
      }, 200);
    } catch (err: any) {
      notifyModal(err.message || 'Password reset failed.', 'error');
    } finally {
      setResetLoading(false);
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
            <Text style={[styles.title, { color: colors.foreground }]}>Sign In</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign In With Email / Mobile & Password
            </Text>
          </View>

          {/* Email / Mobile Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              EMAIL ADDRESS OR MOBILE NUMBER
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
              <Mail size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={handleEmailOrMobileChange}
                placeholder="Enter Email or 10-digit Mobile"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>ACCOUNT PASSWORD</Text>
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

          {/* Forgot Password Link */}
          <View style={styles.forgotRow}>
            <TouchableOpacity onPress={openForgotModal} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0D0E12" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Footer Router Navigation */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setForgotModalVisible(false)}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <KeyRound size={28} color="#FFC700" />
            </View>

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {forgotStep === 1 ? 'Forgot Password?' : forgotStep === 2 ? 'Verify OTP' : 'Set New Password'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              {forgotStep === 1
                ? 'Enter your registered Email address to receive a password reset OTP.'
                : forgotStep === 2
                ? `Enter the OTP sent to ${resetEmail}`
                : 'Create a new secure password for your account.'}
            </Text>

            {/* Inline Alert Banner */}
            {modalAlert && (
              <View
                style={[
                  styles.modalAlertBanner,
                  {
                    backgroundColor:
                      modalAlert.type === 'error'
                        ? 'rgba(244, 63, 94, 0.14)'
                        : modalAlert.type === 'success'
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(245, 158, 11, 0.14)',
                    borderColor:
                      modalAlert.type === 'error'
                        ? 'rgba(244, 63, 94, 0.35)'
                        : modalAlert.type === 'success'
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(245, 158, 11, 0.35)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalAlertText,
                    {
                      color:
                        modalAlert.type === 'error'
                          ? '#F43F5E'
                          : modalAlert.type === 'success'
                          ? '#10B981'
                          : '#F59E0B',
                    },
                  ]}
                >
                  {modalAlert.message}
                </Text>
              </View>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <View style={{ width: '100%', marginTop: 16 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>REGISTERED EMAIL</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, marginTop: 4 }]}>
                  <Mail size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    placeholder="Enter Registered Email"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { marginTop: 20 }]}
                  onPress={handleSendResetOtp}
                  disabled={resetLoading}
                  activeOpacity={0.85}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#0D0E12" size="small" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Send Reset OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <View style={{ width: '100%', marginTop: 16 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>ENTER OTP CODE</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, marginTop: 4 }]}>
                  <KeyRound size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, letterSpacing: 4, fontWeight: '800' }]}
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { marginTop: 20 }]}
                  onPress={handleVerifyResetOtp}
                  disabled={resetLoading}
                  activeOpacity={0.85}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#0D0E12" size="small" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={handleSendResetOtp}
                  disabled={resetLoading}
                >
                  <Text style={{ color: '#FFC700', fontSize: 12, fontWeight: '800' }}>Resend OTP Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: Set New Password */}
            {forgotStep === 3 && (
              <View style={{ width: '100%', marginTop: 16 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, marginTop: 4, marginBottom: 12 }]}>
                  <Lock size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter New Password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.togglePasswordBtn}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} color="#FFC700" />
                    ) : (
                      <Eye size={18} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, marginTop: 4 }]}>
                  <Lock size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm New Password"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.togglePasswordBtn}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#FFC700" />
                    ) : (
                      <Eye size={18} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { marginTop: 20 }]}
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                  activeOpacity={0.85}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#0D0E12" size="small" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
    marginBottom: 24,
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
  loginBtn: {
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
  loginBtnText: {
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
  registerLink: {
    color: '#FFC700',
    fontSize: 13,
    fontWeight: '800',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: -4,
  },
  forgotText: {
    color: '#FFC700',
    fontSize: 11.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 12,
    zIndex: 2,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  modalAlertBanner: {
    width: '100%',
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalAlertText: {
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  modalActionBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  modalActionBtnText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
