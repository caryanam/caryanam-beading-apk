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
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  ArrowRight,
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
  Menu,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CorporateFooter } from '../components/CorporateFooter';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(width * 1.45);
const SINGLE_CARD_IMG_HEIGHT = Math.round(((width - 38) / 3) / 1.25);

const ROLE_CARDS_DATA = [
  {
    id: 'dealer',
    title: 'Dealer Login',
    desc: 'Participate in live auctions, bid on verified vehicles and grow your business.',
    image: require('../assets/dealer.png'),
    btnBg: '#FFB800',
    borderColor: 'rgba(255, 184, 0, 0.45)',
  },
  {
    id: 'freelancer',
    title: 'Freelancer Login',
    desc: 'List vehicles quickly, add basic details and manage your inventory.',
    image: require('../assets/freelancer.png'),
    btnBg: '#60A5FA',
    borderColor: 'rgba(96, 165, 250, 0.45)',
  },
  {
    id: 'inspector',
    title: 'Inspector Login',
    desc: 'Perform 140+ point inspections and submit digital reports.',
    image: require('../assets/inpsector.png'),
    btnBg: '#C084FC',
    borderColor: 'rgba(192, 132, 252, 0.45)',
  },
];

interface HomeScreenProps {
  navigation: any;
  onOpenMenu?: () => void;
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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Hero Banner Section (Matches Design Mockup with Natural Daylight hero-car.png) */}
      <View style={[styles.heroSection, { backgroundColor: isDark ? '#0F121A' : '#F3F4F6' }]}>
        {/* Full Vibrant Hero Image */}
        <Image
          source={require('../assets/hero-car.png')}
          style={styles.heroBgImage}
          resizeMode="cover"
        />

        {/* Subtle Dark Scrim in Dark Theme for Perfect Readability */}
        {isDark && (
          <View
            style={[styles.heroDarkScrim, { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }]}
            pointerEvents="none"
          />
        )}

        {/* Top Header Bar Sitting Directly Over Hero Image */}
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 6, 16) }]}>
          <View style={styles.headerLeftBrand}>
            <View style={styles.headerLogoCircle}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.headerLogoImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.headerBrandTextWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.headerBrandTitleBlack, { color: isDark ? '#FFFFFF' : '#0D0E12' }]}>
                  CARYANAM{' '}
                </Text>
                <Text style={styles.headerBrandTitleGold}>LIVE</Text>
              </View>
              <Text style={[styles.headerBrandSub, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>
                INSPECTION & BIDDING
              </Text>
            </View>
          </View>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={[
                styles.circleActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(15, 18, 26, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(255, 199, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.8}
              onPress={() => onOpenMenu?.()}
              accessibilityLabel="Open menu"
            >
              <Menu size={20} color={isDark ? '#FFC700' : '#0D0E12'} strokeWidth={2.3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Left-Aligned Hero Content */}
        <View style={styles.heroContentWrapper}>
          {/* Gold Outline Pill Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark ? 'rgba(255, 199, 0, 0.15)' : 'rgba(254, 243, 199, 0.95)',
                borderColor: isDark ? 'rgba(255, 199, 0, 0.4)' : 'rgba(217, 119, 6, 0.35)',
              },
            ]}
          >
            <ShieldCheck size={14} color={isDark ? '#FFC700' : '#D97706'} strokeWidth={2.4} style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: isDark ? '#FFC700' : '#78350F' }]}>
              India's Premier B2B Car Bidding Platform
            </Text>
          </View>

          {/* Hero Main Headline - Single Line */}
          <Text
            style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#0D0E12' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Certified Used Car Auctions
          </Text>

          {/* Cursive Subtitle - Single Line */}
          <Text
            style={[styles.heroCursiveSubtitle, { color: isDark ? '#FBBF24' : '#D97706' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Built For Dealer Growth.
          </Text>

          {/* Hero Subtitle Description */}
          <Text style={[styles.heroDescription, { color: isDark ? '#E2E8F0' : '#374151' }]}>
            India's premier B2B car auction platform featuring{' '}
            <Text style={[styles.heroDescHighlight, { color: isDark ? '#FFC700' : '#0D0E12' }]}>
              freelancer vehicle 15-min live auctions
            </Text>
            , certified{' '}
            <Text style={[styles.heroDescHighlight, { color: isDark ? '#FFC700' : '#0D0E12' }]}>
              140+ inspection points
            </Text>
            , and real-time dealer bidding.
          </Text>

          {/* Hero Button Group - Enter Bidding Portal Button */}
          <View style={styles.heroButtonGroup}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: isDark ? '#FFC700' : '#FFFFFF',
                  borderColor: isDark ? '#FFC700' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryBtnText}>Enter Bidding Portal</Text>
              <ArrowRight size={17} color="#0D0E12" strokeWidth={2.5} style={{ marginLeft: 7 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4 Standalone Telemetry Stats Cards Straddling Half on Image & Half Outside */}
      <View style={styles.statsCardContainer}>
        {[
          { val: '2,000+', label: 'INSPECTED\nVEHICLES', icon: Car },
          { val: '500+', label: 'VERIFIED\nDEALERS', icon: Users },
          { val: '30-Min', label: 'LIVE AUCTION\nWINDOWS', icon: Clock },
          { val: '15-Min', label: 'FREELANCER VEHICLE\nLIVE AUCTION', icon: Zap },
        ].map((stat, i) => {
          const IconComp = stat.icon;
          const isDark = theme === 'dark';
          return (
            <View
              key={i}
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#141722' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 199, 0, 0.32)' : 'rgba(254, 240, 138, 0.75)',
                },
              ]}
            >
              {/* Subtle Decorative Background Watermark Icon */}
              <View style={styles.statWatermarkWrap} pointerEvents="none">
                <IconComp
                  size={48}
                  color={isDark ? '#FFC700' : '#F59E0B'}
                  strokeWidth={1.4}
                  opacity={isDark ? 0.18 : 0.14}
                />
              </View>

              <Text
                style={[
                  styles.statValText,
                  { color: isDark ? '#FFC700' : '#D97706' },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {stat.val}
              </Text>
              <Text
                style={[
                  styles.statLabelText,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {stat.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Three Dedicated Role Portal Cards Section (Matches Mockup) */}
      <View style={styles.rolePortalsSection}>
        <View style={styles.rolePortalsHeader}>
          <View
            style={[
              styles.rolePortalsBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 199, 0, 0.12)' : 'rgba(254, 243, 199, 0.95)',
                borderColor: isDark ? 'rgba(255, 199, 0, 0.35)' : 'rgba(217, 119, 6, 0.35)',
              },
            ]}
          >
            <Sparkles size={13} color={isDark ? '#FFC700' : '#D97706'} style={{ marginRight: 6 }} />
            <Text style={[styles.rolePortalsBadgeText, { color: isDark ? '#FFC700' : '#92400E' }]}>
              DEDICATED PORTALS
            </Text>
          </View>
          <Text style={[styles.rolePortalsTitle, { color: colors.foreground }]}>
            Choose Your Dedicated Portal
          </Text>
          <Text style={[styles.rolePortalsSubtitle, { color: colors.mutedForeground }]}>
            Engineered workflows tailored for verified dealers, freelancers, and certified inspectors.
          </Text>
        </View>

        {/* 3 Dedicated Role Portal Cards in One View (No Scroll) */}
        <View style={styles.roleCardsRow}>
          {ROLE_CARDS_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.roleCard,
                {
                  borderColor: isDark ? item.btnBg + '55' : item.borderColor,
                  backgroundColor: isDark ? '#141722' : '#FFFFFF',
                },
              ]}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('Login')}
            >
              {/* Top Artwork Image with Embedded Theme Icon */}
              <View
                style={[
                  styles.roleCardImageWrap,
                  {
                    height: SINGLE_CARD_IMG_HEIGHT,
                    backgroundColor: isDark ? '#0D0E12' : '#F3F4F6',
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.roleCardImage}
                  resizeMode="cover"
                />
              </View>

              {/* Bottom Card Content */}
              <View style={styles.roleCardBody}>
                {/* Decorative Bottom-Left Arc */}
                <View style={[styles.cardCornerAccent, { borderColor: item.btnBg }]} />

                <Text
                  style={[styles.roleCardTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.roleCardDesc, { color: isDark ? '#94A3B8' : colors.mutedForeground }]}
                  numberOfLines={4}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {item.desc}
                </Text>

                {/* Bottom Row with Colored Circular Arrow Button */}
                <View style={styles.roleCardBottomRow}>
                  <View style={[styles.roleCardArrowBtn, { backgroundColor: item.btnBg }]}>
                    <ArrowRight size={13} color="#0D0E12" strokeWidth={2.4} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Platform Innovations Feature Spotlight Section (Matches Mockup) */}
      <View style={[styles.innovationsSection, { backgroundColor: isDark ? '#0B0D13' : '#FFFFFF' }]}>
        <View style={styles.innovationsHeader}>
          <View style={styles.innovationsEyebrowRow}>
            <View style={[styles.innovationsEyebrowLine, { backgroundColor: isDark ? '#FFC700' : '#F59E0B' }]} />
            <Text style={[styles.innovationsSubBadge, { color: isDark ? '#FFC700' : '#F59E0B' }]}>
              PLATFORM INNOVATIONS
            </Text>
            <View style={[styles.innovationsEyebrowLine, { backgroundColor: isDark ? '#FFC700' : '#F59E0B' }]} />
          </View>
          <Text style={[styles.innovationsTitle, { color: colors.foreground }]}>
            Everything Needed for Seamless{'\n'}Vehicle Bidding
          </Text>
        </View>

        <View style={styles.innovationsCardsContainer}>
          {/* Card 1: 140+ Point Digital Inspections */}
          <TouchableOpacity
            style={[
              styles.innovationCard,
              {
                backgroundColor: isDark ? '#141722' : '#FFFDF5',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
              },
            ]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Login')}
          >
            {/* Left Amber Squircle Icon */}
            <View
              style={[
                styles.innovationIconSquircle,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF08A',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={styles.docIconWrap}>
                <View style={styles.docFoldCorner} />
                <View style={[styles.docLine, { width: '60%' }]} />
                <View style={[styles.docLine, { width: '85%' }]} />
                <View style={[styles.docLine, { width: '85%' }]} />
              </View>
            </View>

            {/* Center Content */}
            <View style={styles.innovationCardContent}>
              <Text style={[styles.innovationCardTitle, { color: colors.foreground }]}>
                140+ Point Digital Inspections
              </Text>
              <Text style={[styles.innovationCardDesc, { color: isDark ? '#94A3B8' : '#4B5563' }]}>
                Certified evaluations covering exterior body panels, engine mechanics, electrical systems, OBD diagnostics, tyre tread depths, and mandatory photo proof.
              </Text>
            </View>

            {/* Right Circular Button */}
            <View
              style={[
                styles.innovationArrowBtn,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
              ]}
            >
              <ArrowRight size={17} color={isDark ? '#FFC700' : '#92400E'} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Real-Time WebSocket Bidding */}
          <TouchableOpacity
            style={[
              styles.innovationCard,
              {
                backgroundColor: isDark ? '#141722' : '#F0F9FF',
                borderColor: isDark ? 'rgba(37, 99, 235, 0.4)' : '#BAE6FD',
              },
            ]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Login')}
          >
            {/* Left Blue Squircle Icon */}
            <View
              style={[
                styles.innovationIconSquircle,
                {
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#DBEAFE',
                  borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Zap size={28} color="#2563EB" fill="#2563EB" strokeWidth={1} />
            </View>

            {/* Center Content */}
            <View style={styles.innovationCardContent}>
              <Text style={[styles.innovationCardTitle, { color: colors.foreground }]}>
                Real-Time WebSocket Bidding
              </Text>
              <Text style={[styles.innovationCardDesc, { color: isDark ? '#94A3B8' : '#4B5563' }]}>
                Sub-second bid synchronization with live countdown timers, bid increment controls, and instant leaderboards across all dealer screens.
              </Text>
            </View>

            {/* Right Circular Button */}
            <View
              style={[
                styles.innovationArrowBtn,
                { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE' },
              ]}
            >
              <ArrowRight size={17} color={isDark ? '#60A5FA' : '#1D4ED8'} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          {/* Card 3: Verified Winner Logs & Transparency */}
          <TouchableOpacity
            style={[
              styles.innovationCard,
              {
                backgroundColor: isDark ? '#141722' : '#FAF5FF',
                borderColor: isDark ? 'rgba(147, 51, 234, 0.4)' : '#E9D5FF',
              },
            ]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Login')}
          >
            {/* Left Purple Squircle Icon */}
            <View
              style={[
                styles.innovationIconSquircle,
                {
                  backgroundColor: isDark ? 'rgba(147, 51, 234, 0.16)' : '#F3E8FF',
                  borderColor: isDark ? 'rgba(147, 51, 234, 0.35)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={styles.awardIconWrap}>
                <Award size={30} color="#9333EA" fill="#9333EA" strokeWidth={1.2} />
                <View style={styles.awardStarWrap}>
                  <Star size={11} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1} />
                </View>
              </View>
            </View>

            {/* Center Content */}
            <View style={styles.innovationCardContent}>
              <Text style={[styles.innovationCardTitle, { color: colors.foreground }]}>
                Verified Winner Logs & Transparency
              </Text>
              <Text style={[styles.innovationCardDesc, { color: isDark ? '#94A3B8' : '#4B5563' }]}>
                Complete transparency with verified winner records, bid histories, and structured admin approval workflows.
              </Text>
            </View>

            {/* Right Circular Button */}
            <View
              style={[
                styles.innovationArrowBtn,
                { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF' },
              ]}
            >
              <ArrowRight size={17} color={isDark ? '#C084FC' : '#7E22CE'} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
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
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroDarkScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 14, 18, 0.45)',
    zIndex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerLeftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D0E12',
    borderWidth: 2,
    borderColor: 'rgba(255, 199, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLogoImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerBrandTextWrap: {
    justifyContent: 'center',
  },
  headerBrandTitleBlack: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E12',
    letterSpacing: 0.5,
  },
  headerBrandTitleGold: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFB800',
    letterSpacing: 0.5,
  },
  headerBrandSub: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroContentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  badgeText: {
    color: '#78350F',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0D0E12',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  heroCursiveSubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: Platform.select({
      ios: 'Snell Roundhand',
      android: 'serif',
      default: 'serif',
    }),
    fontStyle: 'italic',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  highlightText: {
    color: '#FFB800',
  },
  heroDescription: {
    fontSize: 12.5,
    lineHeight: 18.5,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
    maxWidth: '74%',
  },
  heroDescHighlight: {
    fontWeight: '800',
    color: '#0D0E12',
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
    alignSelf: 'flex-start',
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  primaryBtnText: {
    color: '#0D0E12',
    fontSize: 14,
    fontWeight: '800',
  },
  statsCardContainer: {
    marginHorizontal: 12,
    marginTop: -46,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
    zIndex: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(254, 240, 138, 0.75)',
    paddingVertical: 14,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  statWatermarkWrap: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    opacity: 0.14,
  },
  statValText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabelText: {
    fontSize: 7.4,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 10,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  rolePortalsSection: {
    paddingTop: 12,
    paddingBottom: 26,
  },
  rolePortalsHeader: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  rolePortalsBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  rolePortalsBadgeText: {
    color: '#92400E',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rolePortalsTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  rolePortalsSubtitle: {
    fontSize: 13,
    lineHeight: 18.5,
    fontWeight: '500',
  },
  roleCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 7,
  },
  roleCard: {
    flex: 1,
    height: 215,
    borderRadius: 16,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  roleCardImageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  roleCardImage: {
    width: '100%',
    height: '100%',
  },
  roleCardBody: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'space-between',
  },
  cardCornerAccent: {
    position: 'absolute',
    bottom: -16,
    left: -16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    opacity: 0.6,
  },
  roleCardTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  roleCardDesc: {
    fontSize: 8.8,
    lineHeight: 12,
    fontWeight: '500',
    height: 48,
  },
  roleCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roleCardArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  innovationsSection: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  innovationsHeader: {
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 12,
  },
  innovationsEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  innovationsEyebrowLine: {
    width: 32,
    height: 1.5,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  innovationsSubBadge: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  innovationsTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  innovationsCardsContainer: {
    gap: 16,
  },
  innovationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  innovationIconSquircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docIconWrap: {
    width: 27,
    height: 33,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  docFoldCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderBottomLeftRadius: 3,
    backgroundColor: '#D97706',
  },
  docLine: {
    height: 2.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginVertical: 1.8,
  },
  awardIconWrap: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  awardStarWrap: {
    position: 'absolute',
    top: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innovationCardContent: {
    flex: 1,
    paddingRight: 8,
  },
  innovationCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 5,
    lineHeight: 20,
  },
  innovationCardDesc: {
    fontSize: 12.2,
    lineHeight: 17.5,
    fontWeight: '400',
  },
  innovationArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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

