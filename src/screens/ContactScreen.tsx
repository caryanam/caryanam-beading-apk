import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  Headphones,
  Send,
  MessageSquare,
  User,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../config/api';

export const ContactScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      showToast({ message: 'Please fill in all enquiry fields', type: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      showToast({ message: 'Please enter a valid 10-digit Indian mobile number', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/public/enquiry', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      const data = response.data;
      if (data.success) {
        showToast({ message: 'Enquiry submitted successfully! We will contact you soon.', type: 'success' });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        showToast({ message: data.message || 'Failed to submit enquiry', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Network error, please check connection and try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const contactChannels = [
    {
      id: 'phone',
      title: 'Direct Helpline',
      val: '+91 7755994123',
      sub: 'Mon - Sat (9:30 AM - 6:30 PM)',
      actionText: 'Call Now',
      icon: Phone,
      color: '#F59E0B',
      onPress: () => Linking.openURL('tel:+917755994123'),
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Desk',
      val: '+91 7755994123',
      sub: 'Fastest Response for Live Auctions',
      actionText: 'Chat Now',
      icon: MessageSquare,
      color: '#10B981',
      onPress: () => Linking.openURL('https://wa.me/917755994123'),
    },
    {
      id: 'email',
      title: 'Email Support',
      val: 'support@caryanamlive.com',
      sub: 'Official Enquiries & Dealership KYC',
      actionText: 'Send Email',
      icon: Mail,
      color: '#3B82F6',
      onPress: () => Linking.openURL('mailto:support@caryanamlive.com'),
    },
    {
      id: 'office',
      title: 'Corporate Office',
      val: 'Pune, Maharashtra',
      sub: 'PIN 411014 • India',
      actionText: 'Main HQ',
      icon: MapPin,
      color: '#A855F7',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentBody}>
        {/* Header Hero */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Headphones size={13} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>24/7 SUPPORT & OPERATIONS</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Contact Caryanam Support
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Direct line to live auction specialists, inspection coordination, and dealership KYC assistance.
          </Text>
        </View>

        {/* 4 Interactive Contact Channels Grid */}
        <View style={styles.channelsGrid}>
          {contactChannels.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.channelCard,
                  {
                    backgroundColor: isDark ? '#141722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                activeOpacity={item.onPress ? 0.75 : 1}
                onPress={item.onPress}
                disabled={item.id === 'office'}
              >
                <View style={styles.channelTopRow}>
                  <View style={[styles.channelIconWrap, { backgroundColor: `${item.color}15` }]}>
                    <IconComp size={18} color={item.color} strokeWidth={2.4} />
                  </View>
                  <View style={[styles.actionChip, { backgroundColor: `${item.color}15`, borderColor: `${item.color}35` }]}>
                    <Text style={[styles.actionChipText, { color: item.color }]}>
                      {item.actionText}
                    </Text>
                    {item.id !== 'office' && (
                      <ArrowUpRight size={11} color={item.color} strokeWidth={2.5} style={{ marginLeft: 2 }} />
                    )}
                  </View>
                </View>

                <Text style={[styles.channelTitle, { color: colors.mutedForeground }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.channelVal, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.val}
                </Text>
                <Text
                  style={[styles.channelSub, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Enquiry Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: isDark ? '#141722' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 199, 0, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={styles.formHeaderRow}>
            <View style={styles.formHeaderIconCircle}>
              <Send size={18} color="#FFC700" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>
                Send Us an Enquiry
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
                Our team responds within 30 minutes during auction hours
              </Text>
            </View>
          </View>

          {/* Full Name Field */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                },
              ]}
            >
              <User size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Business Email Field */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                },
              ]}
            >
              <Mail size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="dealer@dealership.com"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Mobile Phone Field */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.countryCodeBadge}>
                <Text style={[styles.countryCodeText, { color: colors.foreground }]}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  let val = text.replace(/\D/g, '');
                  if (val.length > 0 && !/^[6-9]/.test(val)) {
                    val = val.substring(1);
                  }
                  if (val.length > 10) {
                    val = val.substring(0, 10);
                  }
                  setPhone(val);
                }}
                maxLength={10}
              />
            </View>
          </View>

          {/* Message Textarea */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Enquiry Message</Text>
            <View
              style={[
                styles.textAreaWrapper,
                {
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                },
              ]}
            >
              <TextInput
                style={[styles.textAreaInput, { color: colors.foreground }]}
                placeholder="Describe your inquiry (e.g. KYC verification, listing vehicles, inspection queries)..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0D0E12" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Official Enquiry</Text>
                <Send size={16} color="#0D0E12" strokeWidth={2.5} style={{ marginLeft: 8 }} />
              </>
            )}
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
    paddingTop: 16,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  badge: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#92400E',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  channelCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  channelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  channelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  actionChipText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  channelTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  channelVal: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  channelSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  formCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  formHeaderIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  countryCodeBadge: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(148, 163, 184, 0.3)',
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: 8,
  },
  textAreaWrapper: {
    borderWidth: 1.2,
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#0D0E12',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
