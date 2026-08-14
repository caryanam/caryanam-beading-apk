import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const PrivacyPolicyScreen: React.FC = () => {
  const { colors } = useTheme();

  const sections = [
    {
      title: '1. Information We Collect',
      content: 'We collect data to provide verified bidding services. This includes company incorporation files, dealer licenses, mobile numbers, and device authentication logs. We also store telemetry regarding your live bidding actions, WebSocket connection states, and auction room interaction logs to ensure security and audit compliance.',
    },
    {
      title: '2. How We Use Information',
      content: 'Collected data is strictly utilized to authenticate B2B dealers, manage active live auctions, facilitate direct buyer-seller vehicle inspections, and compile accurate bidding logs. We do not sell or lease your commercial transactions data to third-party marketing brokers.',
    },
    {
      title: '3. Data Security & WebSocket Security',
      content: 'All real-time bidding transmissions and data streams are encrypted using end-to-end Transport Layer Security (TLS). Bidding records and inspector compliance checks are stored on access-restricted cloud databases with continuous monitoring and routine security audits.',
    },
    {
      title: '4. Local Storage & Preferences',
      content: 'We utilize secure local storage and caching (such as AsyncStorage) on your mobile device to store preferences (such as light/dark mode choices) and secure session tokens to keep you logged in. No sensitive bidding details are stored permanently in plain text on the device.',
    },
    {
      title: '5. Data Erasure & Compliance',
      content: 'Verified B2B partners may request account closure and deletion of registration files by writing to support@caryanam.com. Please note that certain bidding transaction logs must be retained for legal, taxation, and dispute resolution purposes.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Shield size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Security & Privacy Commitment</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Last Updated: August 2026
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.narrativeText, { color: colors.foreground }]}>
            At Caryanam, we value your trust and are committed to protecting the integrity and confidentiality of your B2B dealer transactions and registration credentials.
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((section, idx) => (
            <View key={idx} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
              <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>{section.content}</Text>
            </View>
          ))}
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
    marginBottom: 12,
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
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mainCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  narrativeText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
