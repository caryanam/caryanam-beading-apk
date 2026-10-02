import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Trophy,
  Lock,
  CheckCircle2,
  Clock,
  Banknote,
  Headphones,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

interface WhyChooseScreenProps {
  navigation?: any;
}

export const WhyChooseScreen: React.FC<WhyChooseScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const highlights = [
    { label: 'Live Auction Window', value: '15-30 Min', icon: Clock, color: '#F59E0B' },
    { label: 'Settlement Freedom', value: '100% Offline', icon: Banknote, color: '#10B981' },
    { label: 'Shill Bidding Tolerance', value: '0% Zero', icon: Lock, color: '#EF4444' },
  ];

  const advantages = [
    {
      icon: ShieldCheck,
      title: '140+ Point Certified Inspections',
      tag: 'Rigorous Telemetry',
      desc: 'Every vehicle undergoes deep diagnostics covering digital paint thickness, engine compression, chassis frame alignment, OBD scanner codes, and high-resolution photo proof.',
      accent: '#F59E0B',
      lightBg: '#FFFDF5',
      darkBg: 'rgba(245, 158, 11, 0.08)',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
    },
    {
      icon: Zap,
      title: 'Sub-Second WebSocket Live Bids',
      tag: 'Zero Latency',
      desc: 'Our real-time bidding server synchronizes bid increments, active room participants, and countdown timers across all connected dealer screens with zero perceptible delay.',
      accent: '#2563EB',
      lightBg: '#F0F9FF',
      darkBg: 'rgba(37, 99, 235, 0.08)',
      borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BAE6FD',
    },
    {
      icon: Trophy,
      title: 'Transparent Winner Logs & Audits',
      tag: 'Tamper-Proof',
      desc: 'Complete transparency with verified auction winner records, total bid counts, and timestamped bid history logs stored securely to prevent disputes or collusion.',
      accent: '#9333EA',
      lightBg: '#FAF5FF',
      darkBg: 'rgba(147, 51, 234, 0.08)',
      borderColor: isDark ? 'rgba(147, 51, 234, 0.3)' : '#E9D5FF',
    },
    {
      icon: Banknote,
      title: '100% Offline Physical Settlement',
      tag: 'Direct Settlement',
      desc: 'We never hold your vehicle funds. All monetary transactions, physical handovers, and RTO transfers are handled offline directly between the verified parties.',
      accent: '#059669',
      lightBg: '#F0FDF4',
      darkBg: 'rgba(5, 150, 105, 0.08)',
      borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#A7F3D0',
    },
    {
      icon: Lock,
      title: 'Verified Dealer Authentication',
      tag: 'Exclusive Access',
      desc: 'Only KYC-approved automotive dealerships and certified inspectors can participate in live auctions, ensuring a professional and credible bidding environment.',
      accent: '#EA580C',
      lightBg: '#FFF7ED',
      darkBg: 'rgba(234, 88, 12, 0.08)',
      borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : '#FED7AA',
    },
    {
      icon: Headphones,
      title: 'Dedicated 24/7 Relationship Support',
      tag: 'VIP Helpline',
      desc: 'Direct telephone, WhatsApp, and email assistance from seasoned auto remarketing specialists to assist with vehicle inspections, bidding queries, and handovers.',
      accent: '#D97706',
      lightBg: '#FEFCE8',
      darkBg: 'rgba(217, 119, 6, 0.08)',
      borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FEF08A',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentBody}>
        {/* Header Hero Section */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={13} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>CORE PLATFORM ADVANTAGES</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Why Choose Caryanam Live
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Engineered For High-Fidelity Automobile Liquidation & Maximum Dealer Profitability
          </Text>
        </View>

        {/* 3 Metric Highlights Strip */}
        <View style={styles.highlightsRow}>
          {highlights.map((h, i) => {
            const IconComponent = h.icon;
            return (
              <View
                key={i}
                style={[
                  styles.highlightCard,
                  {
                    backgroundColor: isDark ? '#141722' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View style={[styles.highlightIconBg, { backgroundColor: `${h.color}15` }]}>
                  <IconComponent size={16} color={h.color} strokeWidth={2.4} />
                </View>
                <Text style={[styles.highlightVal, { color: h.color }]}>{h.value}</Text>
                <Text
                  style={[styles.highlightLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {h.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Core Advantages List */}
        <View style={styles.advantagesContainer}>
          {advantages.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <View
                key={idx}
                style={[
                  styles.advantageCard,
                  {
                    backgroundColor: isDark ? item.darkBg : item.lightBg,
                    borderColor: item.borderColor,
                  },
                ]}
              >
                <View style={styles.advantageHeader}>
                  <View style={[styles.iconBox, { backgroundColor: `${item.accent}20` }]}>
                    <IconComp size={22} color={item.accent} strokeWidth={2.2} />
                  </View>
                  <View style={styles.advantageTitleWrap}>
                    <View style={styles.titleTagRow}>
                      <Text style={[styles.advantageTitle, { color: colors.foreground }]}>
                        {item.title}
                      </Text>
                    </View>
                    <View style={[styles.tagPill, { borderColor: `${item.accent}40`, backgroundColor: `${item.accent}12` }]}>
                      <Text style={[styles.tagText, { color: item.accent }]}>
                        {item.tag}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.advantageDesc, { color: isDark ? '#94A3B8' : '#4B5563' }]}>
                  {item.desc}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Trust Guarantee Banner */}
        <View
          style={[
            styles.trustBanner,
            {
              backgroundColor: isDark ? 'rgba(255, 199, 0, 0.06)' : 'rgba(254, 243, 199, 0.65)',
              borderColor: isDark ? 'rgba(255, 199, 0, 0.3)' : '#FDE68A',
            },
          ]}
        >
          <View style={styles.checkIconBg}>
            <Check size={20} color="#0D0E12" strokeWidth={2.8} />
          </View>
          <View style={styles.trustTextWrapper}>
            <Text style={[styles.trustTitle, { color: isDark ? '#FFC700' : '#92400E' }]}>
              Built For Performance & Reliability
            </Text>
            <Text style={[styles.trustDesc, { color: isDark ? '#E2E8F0' : '#374151' }]}>
              Trusted by 1,500+ verified dealerships and certified automotive inspectors across India for risk-free vehicle acquisitions.
            </Text>
          </View>
        </View>

        {/* Quick CTA */}
        {navigation && (
          <TouchableOpacity
            style={styles.ctaBottomBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBottomText}>Get Verified Dealer Access</Text>
            <ArrowRight size={17} color="#0D0E12" strokeWidth={2.5} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
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
  highlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 22,
  },
  highlightCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightVal: {
    fontSize: 13.5,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
  },
  highlightLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  advantagesContainer: {
    gap: 14,
    marginBottom: 22,
  },
  advantageCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  advantageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  advantageTitleWrap: {
    flex: 1,
  },
  titleTagRow: {
    marginBottom: 4,
  },
  advantageTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    lineHeight: 20,
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  advantageDesc: {
    fontSize: 12.8,
    lineHeight: 18.5,
    fontWeight: '400',
  },
  trustBanner: {
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trustTextWrapper: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  ctaBottomBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaBottomText: {
    color: '#0D0E12',
    fontSize: 14,
    fontWeight: '900',
  },
});
