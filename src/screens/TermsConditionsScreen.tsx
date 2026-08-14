import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const TermsConditionsScreen: React.FC = () => {
  const { colors } = useTheme();

  const rules = [
    {
      title: '1. Dealer Bidding Eligibility',
      content: 'Participation in Caryanam Bidding auctions is strictly restricted to verified B2B pre-owned car dealerships. Dealers must upload a valid government-issued motor dealer license (GST/Udyam registration) and pass our onboarding vetting process prior to placing any live bids.',
    },
    {
      title: '2. Legally Binding Commitments',
      content: 'Every bid submitted in our live auction rooms represents a legally binding and irrevocable contract to purchase the vehicle at the bid amount. Bid retractions, bidding errors, or accidental clicks will not be accepted. Bidders are advised to check all vehicle evaluation reports before bidding.',
    },
    {
      title: '3. Inspection Report Disclaimer',
      content: 'Caryanam 140+ point inspection reports are provided solely for guidance. Inspectors compile reports based on visual and onboard diagnostics checks. All vehicles are liquidated on an "As-Is, Where-Is" basis. Dealers are strongly encouraged to inspect the vehicle physically before taking delivery.',
    },
    {
      title: '4. Payments & Delivery Timeline',
      content: 'Winning dealers must settle the full purchase invoice and administrative fees within forty-eight (48) hours of winning the auction. Failure to do so will lead to transaction forfeiture, account suspension, and a penalty charged against the dealer security deposit.',
    },
    {
      title: '5. Code of Conduct & Fair Bidding',
      content: 'Any form of auction manipulation, collusion with other dealers, inspector bribery, or deliberate payment defaults will result in permanent account termination, blacklisting from our partner networks, and potential legal arbitration.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <FileText size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Auction Trading Agreement</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Terms & Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Last Updated: August 2026
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.narrativeText, { color: colors.foreground }]}>
            By accessing the Caryanam Bidding portal, you agree to adhere to the B2B auction rules, vehicle payment regulations, and compliance standards detailed below.
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {rules.map((rule, idx) => (
            <View key={idx} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{rule.title}</Text>
              <Text style={[styles.sectionContent, { color: colors.mutedForeground }]}>{rule.content}</Text>
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
