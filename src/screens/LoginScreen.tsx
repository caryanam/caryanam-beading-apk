import React, { useState } from 'react';
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
  StatusBar,
  Platform,
} from 'react-native';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
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
      } else {
        navigation.navigate('DealerDashboard');
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Invalid credentials.', type: 'error' });
    } finally {
      setLoading(false);
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
});
