import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UserX, Trash2, Gavel, FileX2, Mail, Lock, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export const DeleteAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!emailOrMobile.trim()) {
      showToast({ message: 'Email or Mobile Number is required', type: 'warning' });
      return;
    }
    if (!password) {
      showToast({ message: 'Password is required', type: 'warning' });
      return;
    }
    if (!agreed) {
      showToast({ message: 'You must acknowledge the warning', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await authService.deleteAccount(emailOrMobile.trim(), password);
      
      showToast({ message: 'Account permanently deleted.', type: 'success' });
      await authService.logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to delete account.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.4)' }]}>
            <UserX size={14} color="#F43F5E" style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: '#F43F5E' }]}>Deletion Authorization</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Delete Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Permanent Action
          </Text>
        </View>

        {/* Narrative Card / Warning */}
        <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.3)' }]}>
          <View style={styles.warningRow}>
            <View style={[styles.warningIconWrap, { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)' }]}>
              <AlertTriangle size={24} color="#F43F5E" />
            </View>
            <View style={styles.warningTextCol}>
              <Text style={[styles.warningTitle, { color: colors.foreground }]}>Warning: Account deletion is permanent.</Text>
              <Text style={[styles.warningDesc, { color: colors.mutedForeground }]}>
                Deleting your account will remove your profile, revoke bidding access, and unlink historic listings.
              </Text>
            </View>
          </View>
          
          <View style={[styles.impactSummary, { borderTopColor: 'rgba(244,63,94,0.2)' }]}>
            <View style={[styles.impactPill, { backgroundColor: colors.background, borderColor: 'rgba(244,63,94,0.15)' }]}>
              <Trash2 size={16} color="#F43F5E" />
              <Text style={[styles.impactPillText, { color: colors.mutedForeground }]}>Profile Erased</Text>
            </View>
            <View style={[styles.impactPill, { backgroundColor: colors.background, borderColor: 'rgba(244,63,94,0.15)' }]}>
              <Gavel size={16} color="#F59E0B" />
              <Text style={[styles.impactPillText, { color: colors.mutedForeground }]}>Bids Revoked</Text>
            </View>
            <View style={[styles.impactPill, { backgroundColor: colors.background, borderColor: 'rgba(244,63,94,0.15)' }]}>
              <FileX2 size={16} color="#F43F5E" />
              <Text style={[styles.impactPillText, { color: colors.mutedForeground }]}>Listings Unlinked</Text>
            </View>
          </View>
        </View>

        {/* Form Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL ADDRESS OR MOBILE NUMBER</Text>
            <View style={styles.inputWrap}>
              <Mail size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Enter your registered email or mobile"
                placeholderTextColor={colors.mutedForeground}
                value={emailOrMobile}
                onChangeText={setEmailOrMobile}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD CONFIRMATION</Text>
            <View style={styles.inputWrap}>
              <Lock size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Enter your account password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.agreementBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive, { borderColor: agreed ? '#E11D48' : colors.border }]}>
              {agreed && <Check size={14} color="#FFF" />}
            </View>
            <Text style={[styles.agreementText, { color: colors.mutedForeground }]}>
              I understand that deleting my account is permanent and cannot be restored or undone under any circumstances.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, (!agreed || loading) && styles.submitBtnDisabled, { backgroundColor: '#E11D48' }]} 
            activeOpacity={0.8}
            onPress={handleDeleteAccount}
            disabled={!agreed || loading}
          >
            <View style={styles.submitBtnGradient}>
              {loading ? (
                <View style={styles.btnContent}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.submitBtnText}>DELETING ACCOUNT...</Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <UserX size={20} color="#FFF" />
                  <Text style={styles.submitBtnText}>PERMANENTLY DELETE MY ACCOUNT</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <CorporateFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24
},
  contentBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  warningBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  warningTextCol: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  impactSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  impactPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mainCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 15,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 12,
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  
  
  
  
  
  
});
