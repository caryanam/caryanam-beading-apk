import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Scale } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const TermsConditionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Scale size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Legal &amp; Terms Agreement</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Terms &amp; Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Last Updated: 24 August 2026
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.narrativeText, { color: colors.foreground }]}>
            Caryanam India Pvt. Ltd. operates the Caryanam Bidding App. By using the App, you agree to these Terms.
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. Account</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Users must provide accurate registration and business information and keep their account credentials secure.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. Bidding</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>All bids submitted through the App are binding and may not be cancelled or withdrawn. Users are responsible for reviewing vehicle details before placing a bid.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Auction Rules</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Users must not manipulate auctions, collude with other users, use fake accounts, or engage in fraudulent or unauthorized activities.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>4. Payment &amp; Offline Settlement</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>The App is strictly an auction bidding platform and does not process online payments. All vehicle payments, financial settlements, and physical handovers are handled separately and offline between the parties. The winning bidder remains responsible for completing physical settlement within the agreed timeframe.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>5. Account Suspension</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Caryanam may suspend or terminate accounts involved in fraud, auction manipulation, payment default, misuse, or violation of these Terms.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>6. Vehicle Information</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Users should review available vehicle details, inspection reports and documents before bidding.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>7. Service Availability</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>Caryanam aims to provide continuous service but does not guarantee uninterrupted or error-free operation due to technical or network issues.</Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>8. Privacy</Text>
            <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>
              Use of the App is also subject to our{' '}
              <Text 
                style={{ color: '#FFC700', fontWeight: '800' }}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>9. Contact Us</Text>
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
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  sectionContent: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
