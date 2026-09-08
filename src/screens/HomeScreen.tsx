import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import {
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  Zap,
  Trophy,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Clock,
  TrendingUp,
  Car,
  CheckCircle2,
  Sliders,
  Search,
  Award,
  Star,
  Users,
  Flame,
  Gauge,
  FileText,
  ChevronRight,
  Activity,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

// Sample auction data for live carousel
const LIVE_AUCTIONS_DATA = [
  {
    id: 'auc-101',
    title: '2022 Hyundai Creta SX(O) Turbo',
    variant: '1.4L Turbo Petrol DCT • Automatic',
    kms: '28,400 km',
    city: 'Mumbai',
    currentBid: 1185000,
    bidCount: 26,
    timeLeft: '04m : 18s',
    inspectionScore: '4.8/5',
    verifiedPoints: '142 Passed',
    tag: 'HOT DEAL',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80',
    owner: '1st Owner',
    fuel: 'Petrol',
  },
  {
    id: 'auc-102',
    title: '2021 Mahindra Thar LX 4x4',
    variant: '2.0L mStallion Petrol • Hard Top',
    kms: '34,200 km',
    city: 'Delhi NCR',
    currentBid: 1240000,
    bidCount: 38,
    timeLeft: '08m : 45s',
    inspectionScore: '4.9/5',
    verifiedPoints: '145 Passed',
    tag: 'HIGH DEMAND',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    owner: '1st Owner',
    fuel: 'Petrol',
  },
  {
    id: 'auc-103',
    title: '2023 Tata Nexon EV Max Lux',
    variant: '40.5 kWh Battery • 437 km Range',
    kms: '14,800 km',
    city: 'Bengaluru',
    currentBid: 1310000,
    bidCount: 19,
    timeLeft: '12m : 02s',
    inspectionScore: '4.7/5',
    verifiedPoints: '140 Passed',
    tag: 'EV SPECIAL',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    owner: '1st Owner',
    fuel: 'Electric',
  },
  {
    id: 'auc-104',
    title: '2020 BMW 3 Series 320d Sport',
    variant: '2.0L Diesel • Steptronic Sport',
    kms: '42,000 km',
    city: 'Pune',
    currentBid: 2475000,
    bidCount: 45,
    timeLeft: '15m : 30s',
    inspectionScore: '4.9/5',
    verifiedPoints: '148 Passed',
    tag: 'LUXURY SELECTION',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    owner: '1st Owner',
    fuel: 'Diesel',
  },
];

// Live activity feed data
const LIVE_ACTIVITY_FEED = [
  { id: 'act-1', text: 'Dealer #D-482 placed ₹11,85,000 on Hyundai Creta', time: '12s ago', type: 'bid' },
  { id: 'act-2', text: 'AutoHub Delhi won 2020 Honda City for ₹7,40,000', time: '2m ago', type: 'win' },
  { id: 'act-3', text: 'New 140-pt report uploaded: 2022 Kia Seltos GTX+', time: '5m ago', type: 'new' },
  { id: 'act-4', text: 'Metro Motors placed ₹12,40,000 on Mahindra Thar', time: '7m ago', type: 'bid' },
];

// 140+ Point Inspection Categories
const INSPECTION_CATEGORIES = [
  {
    id: 'engine',
    title: 'Engine & Transmission',
    score: '98%',
    checks: ['OBD-II Diagnostic Scan', 'Engine Compression & Blow-by', 'Transmission Shift Dynamics', 'Oil & Fluid Leakage Check'],
  },
  {
    id: 'body',
    title: 'Body & Paintwork',
    score: '96%',
    checks: ['Digital Micrometer Paint Thickness', 'Chassis Frame & Pillar Alignment', 'Accident & Panel Replacement History', 'Rust & Corrosion Inspection'],
  },
  {
    id: 'electrical',
    title: 'Electricals & Tech',
    score: '99%',
    checks: ['Infotainment & Touchscreen Scan', 'Dual-Zone AC Cooling Efficiency', 'Airbag Sensor Telemetry', 'Battery State-of-Health Test'],
  },
  {
    id: 'chassis',
    title: 'Tyres & Suspension',
    score: '95%',
    checks: ['Tread Depth Gauge (All 5 Tyres)', 'Brake Pad & Rotor Wear Analysis', 'Suspension Bushing & Strut Test', 'Steering Column Backlash Check'],
  },
  {
    id: 'docs',
    title: 'Paperwork & RTO',
    score: '100%',
    checks: ['RC Originality & Single Owner Proof', 'NOC & Hypothecation Clear Status', 'Chassis Number Stamping Verification', 'Active Insurance & Challan Status'],
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Hero Banner Section (Dark Premium Car Background) */}
      <View style={styles.heroSection}>
        {/* Dark Luxury Car Background Image */}
        <Image
          source={require('../assets/hero-car.png')}
          style={styles.heroBgImage}
          resizeMode="cover"
        />
        <View style={styles.heroDarkOverlay} />

        <View style={styles.heroContentWrapper}>
          {/* Gold Outline Pill Badge */}
          <View style={styles.badge}>
            <ShieldCheck size={14} color="#FFC700" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>India's Premier B2B Car Bidding Platform</Text>
          </View>

          {/* Hero Main Headline */}
          <Text style={styles.heroTitle}>
            Certified Used Car{'\n'}
            Auctions{'\n'}
            <Text style={styles.highlightText}>Built For Dealer Growth.</Text>
          </Text>

          {/* Hero Subtitle Description */}
          <Text style={styles.heroDescription}>
            Access 140+ point digital inspection reports, participate in real-time 30-minute live auctions, and acquire pre-owned vehicles with complete transparency.
          </Text>

          {/* Hero Capsule Button Group */}
          <View style={styles.heroButtonGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryBtnText}>Enter Bidding Portal</Text>
              <ArrowRight size={18} color="#0D0E12" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WhyChoose')}
            >
              <Text style={styles.secondaryBtnText}>Why Caryanam Bidding</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Telemetry Stats Section */}
      <View style={[styles.statsSection, { backgroundColor: theme === 'dark' ? '#090A0E' : '#F8F9FA' }]}>
        <View style={styles.statsRowsWrapper}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            {[
              { val: '25,000+', label: 'INSPECTED VEHICLES', icon: Car },
              { val: '1,500+', label: 'VERIFIED DEALERS', icon: Users },
            ].map((stat, i) => {
              const IconComp = stat.icon;
              return (
                <View
                  key={i}
                  style={[
                    styles.statGlassCard,
                    {
                      backgroundColor: theme === 'dark' ? 'rgba(21, 24, 36, 0.7)' : '#FFFFFF',
                      borderColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.25)' : 'rgba(255, 199, 0, 0.35)',
                    },
                  ]}
                >
                  <View style={styles.statIconBadge}>
                    <IconComp size={16} color="#FFC700" />
                  </View>
                  <Text style={styles.statValText}>{stat.val}</Text>
                  <Text style={[styles.statLabelText, { color: colors.mutedForeground }]}>
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Row 2 */}
          <View style={styles.statsRow}>
            {[
              { val: '30-Min', label: 'LIVE AUCTION WINDOWS', icon: Clock },
              { val: '100%', label: 'INSPECTION AUTHENTICITY', icon: ShieldCheck },
            ].map((stat, i) => {
              const IconComp = stat.icon;
              return (
                <View
                  key={i}
                  style={[
                    styles.statGlassCard,
                    {
                      backgroundColor: theme === 'dark' ? 'rgba(21, 24, 36, 0.7)' : '#FFFFFF',
                      borderColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.25)' : 'rgba(255, 199, 0, 0.35)',
                    },
                  ]}
                >
                  <View style={styles.statIconBadge}>
                    <IconComp size={16} color="#FFC700" />
                  </View>
                  <Text style={styles.statValText}>{stat.val}</Text>
                  <Text style={[styles.statLabelText, { color: colors.mutedForeground }]}>
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Platform Innovations Feature Spotlight Section */}
      <View style={[styles.innovationsSection, { backgroundColor: theme === 'dark' ? '#0D0E12' : '#FFFFFF' }]}>
        <View style={styles.innovationsHeader}>
          <Text style={styles.innovationsSubBadge}>PLATFORM INNOVATIONS</Text>
          <Text style={[styles.innovationsTitle, { color: colors.foreground }]}>
            Everything Needed for Seamless Vehicle Bidding
          </Text>
        </View>

        <View style={styles.innovationsCardsContainer}>
          {[
            {
              icon: ClipboardCheck,
              title: '140+ Point Digital Inspections',
              desc: 'Certified evaluations covering exterior body panels, engine mechanics, electrical systems, OBD diagnostics, tyre tread depths, and mandatory photo proof.',
            },
            {
              icon: Zap,
              title: 'Real-Time WebSocket Bidding',
              desc: 'Sub-second bid synchronization with live countdown timers, bid increment controls, and instant leaderboards across all dealer screens.',
            },
            {
              icon: Award,
              title: 'Verified Winner Logs & Transparency',
              desc: 'Complete transparency with verified winner records, bid histories, and structured admin approval workflows.',
            },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <View
                key={idx}
                style={[
                  styles.innovationCard,
                  {
                    backgroundColor: theme === 'dark' ? '#141722' : '#F9FAFB',
                    borderColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.25)' : 'rgba(255, 199, 0, 0.4)',
                  },
                ]}
              >
                <View style={styles.innovationIconCircle}>
                  <IconComponent size={22} color="#FFC700" />
                </View>
                <Text style={[styles.innovationCardTitle, { color: colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.innovationCardDesc, { color: colors.mutedForeground }]}>
                  {item.desc}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Corporate Footer */}
      <CorporateFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    minHeight: SCREEN_HEIGHT - 70,
    justifyContent: 'center',
    backgroundColor: '#0D0E12',
    overflow: 'hidden',
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 14, 18, 0.65)',
  },
  heroContentWrapper: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(50, 42, 10, 0.65)',
    borderColor: 'rgba(255, 199, 0, 0.45)',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFC700',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  highlightText: {
    color: '#FFC700',
  },
  heroDescription: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 28,
  },
  searchBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2,
  },
  clearSearchText: {
    color: '#FFC700',
    fontSize: 12,
    fontWeight: '700',
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pillsScrollSub: {
    flexDirection: 'row',
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroButtonGroup: {
    flexDirection: 'column',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 28,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#0D0E12',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryBtn: {
    backgroundColor: '#161820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statsSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.15)',
  },
  statsRowsWrapper: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statGlassCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
  },
  statValText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFC700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  innovationsSection: {
    paddingVertical: 32,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.15)',
  },
  innovationsHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  innovationsSubBadge: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  innovationsTitle: {
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  innovationsCardsContainer: {
    gap: 16,
  },
  innovationCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  innovationIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  innovationCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 22,
  },
  innovationCardDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  activityTicker: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  tickerHeaderTitle: {
    color: '#FFC700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tickerScroll: {
    flexDirection: 'row',
  },
  tickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  tickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  tickerText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  tickerTime: {
    color: '#FFC700',
    fontSize: 10,
    fontWeight: '800',
  },
  auctionsSection: {
    paddingVertical: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionBadgeText: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  viewAllText: {
    color: '#FFC700',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    marginHorizontal: 18,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetFilterText: {
    color: '#FFC700',
    fontSize: 13,
    fontWeight: '800',
  },
  cardsScroll: {
    paddingLeft: 18,
    paddingRight: 10,
  },
  carCard: {
    width: width * 0.82,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 170,
    width: '100%',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFC700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagBadgeText: {
    color: '#0D0E12',
    fontSize: 10,
    fontWeight: '900',
  },
  timerBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(13, 14, 18, 0.85)',
    borderColor: '#FFC700',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
  },
  titleScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  carVariant: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inspectionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  inspectionBarText: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '700',
  },
  bidInfoRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFC700',
  },
  quickIncrementBtn: {
    backgroundColor: 'rgba(255,199,0,0.15)',
    borderColor: '#FFC700',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickIncrementText: {
    color: '#FFC700',
    fontSize: 12,
    fontWeight: '900',
  },
  cardBidBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBidBtnText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFC700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inspectionSection: {
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  sectionHeaderCenter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionBadgeCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,199,0,0.12)',
    borderColor: 'rgba(255,199,0,0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  sectionTitleCenter: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionDescCenter: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  sectionSubTitle: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '800',
  },
  inspectionDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  inspectionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inspectionDetailTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  inspectionDetailSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreBadgeContainer: {
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreVal: {
    color: '#0D0E12',
    fontSize: 16,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#0D0E12',
    fontSize: 9,
    fontWeight: '800',
  },
  checksGrid: {
    gap: 10,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sampleReportFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleReportText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  howItWorksSection: {
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  stepsContainer: {
    gap: 14,
  },
  stepCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  stepTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumBadge: {
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: '#FFC700',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepNumText: {
    color: '#FFC700',
    fontSize: 12,
    fontWeight: '900',
  },
  stepIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  testimonialsSection: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  reviewsGrid: {
    gap: 14,
  },
  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '900',
  },
  reviewerDealer: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingPill: {
    backgroundColor: '#FFC700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#0D0E12',
    fontSize: 11,
    fontWeight: '900',
  },
  reviewComment: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  ctaSection: {
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 30,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  ctaButtonGroup: {
    width: '100%',
    gap: 10,
  },
  ctaRegisterBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaRegisterText: {
    color: '#0D0E12',
    fontSize: 14,
    fontWeight: '900',
  },
  ctaContactBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaContactText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerSection: {
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  footerLogoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 199, 0, 0.6)',
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  footerBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  footerBrandSub: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '700',
  },
  footerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  footerCol: {
    gap: 8,
  },
  footerColTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerContactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerBottomRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

