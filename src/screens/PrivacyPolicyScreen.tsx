import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Shield, FileText, UserCheck, Share2, Lock, Database, Layers, RefreshCw, Phone, Mail, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Shield size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Legal &amp; Compliance</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Last Updated: 24 August 2026
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.narrativeText, { color: colors.foreground }]}>
            Caryanam India Pvt. Ltd. ("Caryanam", "we", "our") operates the Caryanam Bidding App. This Privacy Policy explains how we collect and use information when you use our App.
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. Information We Collect</Text>
            <Text style={[styles.sectionContent, { color: colors.foreground, marginBottom: 8, fontWeight: '700' }]}>We may collect:</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Name, mobile number and email address</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Company/dealer registration details</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Vehicle details, photos and inspection information</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Bidding and auction activity</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Device, network and technical information</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Login, security and usage information</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. How We Use Information</Text>
            <Text style={[styles.sectionContent, { color: colors.foreground, marginBottom: 8, fontWeight: '700' }]}>We use this information to:</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Create and manage user accounts</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Verify dealers and businesses</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Provide vehicle auction and bidding services</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Process and record bids</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Send OTPs, notifications and service updates</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Prevent fraud and unauthorized activity</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Maintain security and audit records</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Provide customer support</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>• Comply with applicable laws</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Data Sharing</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground, marginBottom: 12 }]}>We may share information with authorized service providers, business partners, technology infrastructure providers, legal authorities, or other parties where required to provide our services or comply with applicable law.</Text>
            <Text style={[styles.sectionContent, { color: colors.foreground, fontWeight: '700' }]}>We do not sell personal information as a commercial product.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>4. Data Security</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>We use reasonable technical and organizational measures to protect user information. However, no electronic system can be guaranteed to be completely secure.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>5. Data Retention &amp; Deletion</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground, marginBottom: 12 }]}>We retain information as necessary to provide our services, maintain business records, prevent fraud, resolve disputes and comply with legal requirements.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <Text style={[styles.sectionContent, { color: colors.foreground, flex: 1, minWidth: 200, fontWeight: '700' }]}>Users may request account/data deletion by contacting us.</Text>
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => navigation.navigate('DeleteAccount')}
              >
                <Trash2 size={14} color="#FFF" />
                <Text style={styles.deleteBtnText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>6. Third-Party Services</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>The App may use third-party services for hosting, authentication, notifications, analytics, communication and other operational purposes.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>7. Changes to This Policy</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>We may update this Privacy Policy from time to time. Updated policies will be made available through the App or our website.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>8. Contact Us</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Mobile Helpline: +91 7755994123{'\n'}Support Email: support@caryanamlive.com</Text>
          </View>

        </View>
      </View>
      <CorporateFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 24 },
  contentBody: { paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  badge: {
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: 'rgba(255, 199, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: { color: '#FFC700', fontSize: 12, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  mainCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 20 },
  narrativeText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  sectionsContainer: { gap: 16, marginBottom: 40 },
  sectionCard: { borderWidth: 1, borderRadius: 18, padding: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  sectionContent: { fontSize: 13, lineHeight: 22, fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800'
  }
});
