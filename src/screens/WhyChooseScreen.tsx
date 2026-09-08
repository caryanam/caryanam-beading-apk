import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sparkles, ShieldCheck, Zap, Trophy, Lock, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

export const WhyChooseScreen: React.FC = () => {
  const { colors } = useTheme();

  const advantages = [
    {
      icon: ShieldCheck,
      title: '140+ Point Certified Inspections',
      desc: 'Every vehicle undergoes rigorous evaluation covering body panels, engine diagnostics, electrical systems, tyres, and documentation with mandatory high-resolution photo evidence.',
    },
    {
      icon: Zap,
      title: 'Sub-Second WebSocket Live Bids',
      desc: 'Our real-time bidding server synchronizes bids, active room logs, and live 30-minute auction countdown timers instantaneously across all connected dealer devices.',
    },
    {
      icon: Trophy,
      title: 'Transparent Winners & Bid Logs',
      desc: 'Complete transparency with verified auction winner records, total bid counts, and detailed bid history logs stored securely.',
    },
    {
      icon: Lock,
      title: 'Verified Dealer Authentication',
      desc: 'Only verified dealer accounts can participate in live auctions, ensuring a secure and credible bidding environment for all partners.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentBody}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Core Platform Advantages</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Why Choose Caryanam Bidding</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Engineered For High-Fidelity Automobile Liquidation
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {advantages.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <View key={idx} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBg}>
                    <IconComponent size={20} color="#FFC700" />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                </View>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* Bottom Trust Banner */}
        <View style={[styles.trustBanner, { borderColor: 'rgba(255, 199, 0, 0.4)' }]}>
          <View style={styles.checkIconBg}>
            <Check size={20} color="#0D0E12" />
          </View>
          <View style={styles.trustTextWrapper}>
            <Text style={[styles.trustTitle, { color: colors.foreground }]}>
              Built For Performance & Reliability
            </Text>
            <Text style={[styles.trustDesc, { color: colors.mutedForeground }]}>
              Trusted by 1,500+ verified dealerships and certified automotive inspectors across India.
            </Text>
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
    marginBottom: 28,
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
    letterSpacing: 1,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  trustBanner: {
    backgroundColor: 'rgba(255, 199, 0, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
  },
  checkIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTextWrapper: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});
