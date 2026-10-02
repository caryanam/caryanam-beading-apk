import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Award,
  Users,
  Car,
  Target,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

interface AboutScreenProps {
  navigation?: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const highlights = [
    { label: 'Inspected Vehicles', value: '2,000+', icon: Car, color: '#F59E0B' },
    { label: 'Verified Dealers', value: '500+', icon: Users, color: '#2563EB' },
    { label: 'Quality Checks', value: '140+ Pts', icon: ShieldCheck, color: '#10B981' },
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      title: '140+ Point Certified Inspections',
      tag: 'Digital Telemetry',
      desc: 'Trained automotive inspectors perform multi-point evaluations covering chassis frame alignment, engine compression, digital micrometer paint thickness, OBD scanner diagnostics, and mandatory photo proof.',
      accent: '#F59E0B',
      lightBg: '#FFFDF5',
      darkBg: 'rgba(245, 158, 11, 0.08)',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
    },
    {
      icon: Zap,
      title: 'Sub-Second Live Auction Engine',
      tag: 'Zero Latency',
      desc: 'Built on high-performance WebSockets, our live auction rooms synchronize real-time bids, countdown timers, and instant leaderboards across dealer devices across India simultaneously.',
      accent: '#2563EB',
      lightBg: '#F0F9FF',
      darkBg: 'rgba(37, 99, 235, 0.08)',
      borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BAE6FD',
    },
    {
      icon: Award,
      title: 'Immutable Winner Logs & Audits',
      tag: 'Zero Collusion',
      desc: 'Every placed bid is recorded with immutable microsecond timestamps. We enforce absolute auction transparency with zero shill bidding and verified winner certificates.',
      accent: '#9333EA',
      lightBg: '#FAF5FF',
      darkBg: 'rgba(147, 51, 234, 0.08)',
      borderColor: isDark ? 'rgba(147, 51, 234, 0.3)' : '#E9D5FF',
    },
    {
      icon: Users,
      title: 'Verified Partner Ecosystem',
      tag: 'Verified Network',
      desc: 'Exclusive access reserved for verified automotive dealerships, enterprise leasing fleets, and licensed inspectors ensures a professional, secure, and scam-free liquidation pipeline.',
      accent: '#059669',
      lightBg: '#F0FDF4',
      darkBg: 'rgba(5, 150, 105, 0.08)',
      borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#A7F3D0',
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
            <Text style={styles.badgeText}>ABOUT CARYANAM LIVE</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            India's Premier B2B Car Auction Network
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Standardized 140+ point physical inspections paired with real-time WebSocket live dealer bidding.
          </Text>
        </View>

        {/* 3 Metric Highlights Strip (Exact Same as Why Choose Us) */}
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

        {/* Mission Statement Card */}
        <View
          style={[
            styles.missionCard,
            {
              backgroundColor: isDark ? '#141722' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 199, 0, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={styles.missionHeader}>
            <View style={styles.missionIconWrap}>
              <Target size={20} color="#FFC700" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.missionTitle, { color: colors.foreground }]}>
                Our Vision & Mission
              </Text>
              <Text style={[styles.missionSubtitle, { color: colors.mutedForeground }]}>
                Empowering Indian Dealerships Since 2026
              </Text>
            </View>
          </View>
          <Text style={[styles.missionDesc, { color: isDark ? '#D1D5DB' : '#374151' }]}>
            Caryanam Live operates as India's dedicated B2B used vehicle remarketing and digital evaluation platform. We eliminate traditional auction ambiguity by combining institutional-grade 140+ point physical inspections with sub-second WebSocket live bidding rooms.
          </Text>
        </View>

        {/* Architectural Pillars (Exact Same Card Layout as Why Choose Us) */}
        <View style={styles.advantagesContainer}>
          {pillars.map((item, idx) => {
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
                    <View
                      style={[
                        styles.tagPill,
                        { borderColor: `${item.accent}40`, backgroundColor: `${item.accent}12` },
                      ]}
                    >
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
              Built For Dealer Growth & Integrity
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
            <Text style={styles.ctaBottomText}>Join Verified Dealer Network</Text>
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
    marginBottom: 20,
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
  missionCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  missionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  missionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  missionDesc: {
    fontSize: 12.8,
    lineHeight: 19,
    fontWeight: '400',
  },
  advantagesContainer: {
    gap: 14,
    marginBottom: 20,
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
