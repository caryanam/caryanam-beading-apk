import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sparkles, ShieldCheck, Award, Users } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const AboutScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Established B2B Remarketing Platform</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>About Caryanam Bidding</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            India's Premier Used Car Inspection & Live Dealer Auction Infrastructure
          </Text>
        </View>

        {/* Narrative Card */}
        <View style={[styles.mainNarrativeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.narrativeText, { color: colors.foreground }]}>
            Caryanam Bidding is a technology-driven vehicle remarketing and digital evaluation platform connecting certified automobile inspectors, auction managers, and verified pre-owned car dealers across India.
          </Text>
        </View>

        <Text style={[styles.missionText, { color: colors.mutedForeground }]}>
          Our mission is to bring absolute transparency, standardized evaluation benchmarks, and sub-second bidding speed to pre-owned vehicle auctions. By pairing 140+ point digital inspection reports with real-time WebSocket live auctions, Caryanam empowers dealers to acquire inventory with complete confidence.
        </Text>

        {/* 2 Key Feature Cards */}
        <View style={styles.cardsContainer}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.iconBg}>
              <ShieldCheck size={22} color="#FFC700" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>140+ Point Inspection Quality</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
              Certified inspectors evaluate exterior body panels, engine mechanics, electrical systems, OBD scanner codes, tyre tread wear, and legal documentation with mandatory photo proof.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
            <View style={[styles.iconBg, styles.emeraldIconBg]}>
              <Award size={22} color="#10B981" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sub-Second Live Auction Engine</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
              Powers 30-minute live auctions with sub-second WebSocket bid synchronization, countdown timers, and immediate winner determination across dealer devices.
            </Text>
          </View>
        </View>

        {/* Unified Callout Banner */}
        <View style={[styles.calloutBanner, { borderColor: 'rgba(255, 199, 0, 0.4)' }]}>
          <View style={styles.calloutTitleRow}>
            <Users size={18} color="#FFC700" style={{ marginRight: 8 }} />
            <Text style={styles.calloutTitle}>Unified B2B Auction Ecosystem</Text>
          </View>
          <Text style={[styles.calloutDesc, { color: colors.foreground }]}>
            Whether sourcing pre-owned inventory, conducting 140+ point evaluations, or managing live auction rooms, Caryanam Bidding provides a high-fidelity workspace engineered for performance.
          </Text>
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
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mainNarrativeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  narrativeText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  missionText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emeraldIconBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  calloutBanner: {
    backgroundColor: 'rgba(255, 199, 0, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 40,
  },
  calloutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFC700',
  },
  calloutDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});
