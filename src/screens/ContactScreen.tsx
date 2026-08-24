import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  Headphones,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const ContactScreen: React.FC = () => {
  const { colors } = useTheme();

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
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 40 }]}>
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
});
