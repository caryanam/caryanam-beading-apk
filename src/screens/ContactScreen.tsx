import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  Headphones,
  Send,
  MessageSquare
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, apiClient } from '../config/api';

export const ContactScreen: React.FC = () => {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !phone || !message) {
      showToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      showToast({ message: 'Please enter a valid 10-digit Indian mobile number', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // using apiClient to avoid double-slash URL issues and benefit from base config
      const response = await apiClient.post('/api/public/enquiry', { name, email, phone, message });
      const data = response.data;
      if (data.success) {
        showToast({ message: 'Enquiry submitted successfully!', type: 'success' });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        showToast({ message: data.message || 'Failed to submit enquiry', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Network error, please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Headphones size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>24/7 Support & Operations</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Contact Us</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Get in Touch with the Caryanam Bidding Team
          </Text>
        </View>

        {/* Contact Information Card */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={[styles.infoBoxHeader, { borderBottomColor: colors.border }]}>
            <Building2 size={16} color="#FFC700" style={{ marginRight: 8 }} />
            <Text style={[styles.infoBoxTitle, { color: colors.foreground }]}>Contact Information</Text>
          </View>

          {/* Address */}
          <View style={styles.infoRow}>
            <Building2 size={20} color={colors.mutedForeground} />
            <View style={styles.infoTextCol}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>OFFICE ADDRESS</Text>
              <Text style={[styles.infoVal, { color: colors.foreground }]}>
                Pune, Maharashtra 411014
              </Text>
            </View>
          </View>

          {/* Mobile / Helpline */}
          <View style={styles.infoRow}>
            <Phone size={20} color="#FFC700" />
            <View style={styles.infoTextCol}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>MOBILE CONTACT NUMBER</Text>
              <Text style={[styles.infoVal, { color: '#FFC700', fontWeight: '900', fontSize: 16 }]}>
                +91 7755994123
              </Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <Mail size={20} color={colors.mutedForeground} />
            <View style={styles.infoTextCol}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.infoVal, { color: colors.foreground }]}>support@caryanamlive.com</Text>
            </View>
          </View>

          {/* Hours */}
          <View style={styles.infoRow}>
            <Clock size={20} color={colors.mutedForeground} />
            <View style={styles.infoTextCol}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>WORKING HOURS</Text>
              <Text style={[styles.infoVal, { color: colors.foreground }]}>Mon - Sat (9:30 AM - 6:30 PM IST)</Text>
            </View>
          </View>
        </View>

        {/* Enquiry Form */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 40 }]}>
          <View style={[styles.infoBoxHeader, { borderBottomColor: colors.border }]}>
            <MessageSquare size={16} color="#FFC700" style={{ marginRight: 8 }} />
            <Text style={[styles.infoBoxTitle, { color: colors.foreground }]}>Send us an Enquiry</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="John Doe"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="john@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                let val = text.replace(/\D/g, ''); // strip non-numeric
                if (val.length > 0 && !/^[6-9]/.test(val)) {
                  val = val.substring(1); // remove first char if it's not 6-9
                }
                if (val.length > 10) {
                  val = val.substring(0, 10); // cap at 10 digits
                }
                setPhone(val);
              }}
              maxLength={10}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="How can we help you?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Enquiry</Text>
                <Send size={16} color="#000" />
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
    paddingTop: 24,
  },
  contentBody: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: 'rgba(255, 199, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFC700',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#FFC700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
