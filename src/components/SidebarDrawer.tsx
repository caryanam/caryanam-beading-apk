import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Home,
  Info,
  Star,
  Headphones,
  LogIn,
  UserPlus,
  X,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Store,
  Gavel,
  Plus,
  Car,
  Heart,
  Users,
  TrendingUp,
  Bell,
  Upload,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  currentRouteName?: string;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  visible,
  onClose,
  navigation,
  currentRouteName = 'Home',
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      authService.getStoredSession().then((session) => {
        setUser(session);
      });
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (screenName: string) => {
    if (screenName === 'Logout') {
      onClose();
      authService.logout().then(() => {
        setUser(null);
        setTimeout(() => {
          navigation.navigate('Home');
        }, 150);
      });
      return;
    }
    if (
      screenName === 'LiveBidding' ||
      screenName === 'AddVehicle' ||
      screenName === 'Marketplace' ||
      screenName === 'Watchlist'
    ) {
      onClose();
      setTimeout(() => {
        showToast({ message: `${screenName} module navigation...`, type: 'info' });
      }, 150);
      return;
    }
    onClose();
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 150);
  };

  const handleHeaderClick = () => {
    const role = user?.role ? String(user.role).toLowerCase() : '';
    if (role === 'inspector' || currentRouteName.startsWith('Inspector')) {
      onClose();
      setTimeout(() => {
        navigation.navigate('InspectorProfile');
      }, 150);
    } else if (role === 'freelancer' || currentRouteName.startsWith('Freelancer')) {
      onClose();
      setTimeout(() => {
        navigation.navigate('FreelancerProfile');
      }, 150);
    } else if (role === 'dealer' || currentRouteName.startsWith('Dealer')) {
      onClose();
      setTimeout(() => {
        navigation.navigate('DealerProfile');
      }, 150);
    }
  };

  if (!visible) return null;

  const isDashboardRoute =
    currentRouteName.startsWith('Admin') ||
    currentRouteName.startsWith('Dealer') ||
    currentRouteName.startsWith('Inspector') ||
    currentRouteName.startsWith('Freelancer');

  const menuSections = [
    {
      title: isDashboardRoute ? 'WORKSPACE MODULES' : 'DISCOVER LOBBY',
      items: isDashboardRoute
        ? (currentRouteName.startsWith('Admin')
            ? [
                { id: 'AdminDashboard', label: 'Dashboard', subtitle: 'Enterprise telemetry', icon: LayoutDashboard },
                { id: 'AdminVehicles', label: 'Vehicles', subtitle: 'Manage inspection reports', icon: Car },
                { id: 'AdminAuctions', label: 'Auctions', subtitle: 'Live bidding rooms', icon: Gavel },
                { id: 'AdminLiveBidding', label: 'Live Monitor', subtitle: 'Active auction status log', icon: Bell },
                { id: 'AdminDealers', label: 'Dealers', subtitle: 'Verified dealer network', icon: Store },
                { id: 'AdminInspectors', label: 'Inspectors', subtitle: 'Active field inspectors', icon: Users },
                { id: 'AdminFreelancers', label: 'Freelancers', subtitle: 'Freelance inspectors', icon: Users },
                { id: 'AdminAnalytics', label: 'Analytics', subtitle: 'Monthly volumes & pipeline', icon: TrendingUp },
              ]
            : currentRouteName.startsWith('Inspector')
            ? [
                { id: 'InspectorDashboard', label: 'Inspector Console', subtitle: 'Evaluation telemetry logs', icon: LayoutDashboard },
                { id: 'InspectorVehicles', label: 'My Vehicles', subtitle: 'All inspection reports', icon: Car },
                { id: 'InspectorAddVehicle', label: 'Add Vehicle', subtitle: 'Create new inspection report', icon: Plus },
                { id: 'InspectorProfile', label: 'Profile', subtitle: 'Personal profile settings', icon: Users },
              ]
            : currentRouteName.startsWith('Freelancer')
            ? [
                { id: 'FreelancerDashboard', label: 'Dashboard', subtitle: 'Evaluation telemetry logs', icon: LayoutDashboard },
                { id: 'FreelancerAddVehicle', label: 'Add Vehicle', subtitle: 'Create new inspection report', icon: Upload },
                { id: 'FreelancerVehicles', label: 'My Vehicles', subtitle: 'All inspection reports', icon: Car },
                { id: 'FreelancerProfile', label: 'Profile', subtitle: 'Personal profile settings', icon: Users },
              ]
            : [
                { id: 'DealerDashboard', label: 'Dashboard', subtitle: 'Live bidding workspace', icon: LayoutDashboard },
                { id: 'DealerMarketplace', label: 'Marketplace', subtitle: 'Browse certified vehicles', icon: Car },
                { id: 'DealerBids', label: 'My Bids', subtitle: 'Track all placed bids', icon: Gavel },
                { id: 'DealerFavourites', label: 'Favourites', subtitle: 'Saved favourite vehicles', icon: Heart },
                { id: 'DealerFreelancerVehicles', label: 'Freelancer Vehicles', subtitle: 'Evaluated by freelancers', icon: Car },
                { id: 'DealerProfile', label: 'Profile', subtitle: 'Dealership profile settings', icon: Users },
              ])
        : [
            { id: 'Home', label: 'Home', subtitle: 'Live bidding & vehicle grid', icon: Home },
            { id: 'About', label: 'About Us', subtitle: 'Who we are & our legacy', icon: Info },
            { id: 'WhyChoose', label: 'Why Choose Us', subtitle: 'Why elite dealers choose us', icon: Star },
          ],
    },
    {
      title: isDashboardRoute ? 'SESSION CONTROL' : 'PARTNER NETWORK',
      items: isDashboardRoute
        ? (currentRouteName.startsWith('Admin')
            ? [
                { id: 'Logout', label: 'Sign Out', subtitle: 'Securely end active session', icon: LogOut },
              ]
            : [
                { id: 'Logout', label: 'Sign Out', subtitle: 'Securely end active session', icon: LogOut },
              ])
        : [
            { id: 'Contact', label: 'Contact Support', subtitle: '24/7 VIP dealer assistance', icon: Headphones },
            { id: 'Login', label: 'Sign In', subtitle: 'Access bidding workspace', icon: LogIn },
            { id: 'Register', label: 'Register Account', subtitle: 'Register for bidding opportunities', icon: UserPlus },
          ],
    },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawerContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            {/* Decorative ambient glow circles */}
            <View
              style={[
                styles.glowCircleTop,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.08)' : 'rgba(255, 199, 0, 0.12)',
                },
              ]}
            />
            <View
              style={[
                styles.glowCircleBottom,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.06)' : 'rgba(255, 199, 0, 0.09)',
                },
              ]}
            />

            {/* Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.brandRow}
                onPress={handleHeaderClick}
                activeOpacity={user ? 0.7 : 1}
                disabled={!user}
              >
                <View style={[styles.logoContainer, { borderColor: colors.primary }]}>
                  <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="cover" />
                </View>
                {isDashboardRoute && user ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={[styles.brandTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {user.role === 'admin' ? 'ADMIN' : user.role === 'inspector' ? 'INSPECTOR' : user.role === 'freelancer' ? 'FREELANCER' : 'DEALER'}
                      </Text>
                      {user.role !== 'admin' && (
                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: 'rgba(255, 199, 0, 0.12)',
                              borderColor: 'rgba(255, 199, 0, 0.3)',
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: '#FFC700', fontSize: 9, fontWeight: '900' }]}>
                            {user.role.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {user.name || user.email}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.titleBadgeRow}>
                      <Text style={[styles.brandTitle, { color: colors.foreground }]}>Caryanam</Text>
                      <View
                        style={[
                          styles.badgePill,
                          {
                            backgroundColor: 'rgba(255, 199, 0, 0.12)',
                            borderColor: 'rgba(255, 199, 0, 0.3)',
                          },
                        ]}
                      >
                        <Text style={styles.badgeText}>B2B</Text>
                      </View>
                    </View>
                    <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>
                      Used Car Bidding Platform
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Theme Mode Segmented Controller */}
            <View style={styles.themeRow}>
              <Text style={[styles.themeTitleText, { color: colors.mutedForeground }]}>APPEARANCE</Text>
              <View style={[styles.segmentContainer, { backgroundColor: colors.secondary }]}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    theme === 'light' && [styles.segmentActiveButton, { backgroundColor: colors.card }],
                  ]}
                  onPress={() => theme !== 'light' && toggleTheme()}
                  activeOpacity={0.8}
                >
                  <Sun size={15} color={theme === 'light' ? '#FFC700' : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: theme === 'light' ? colors.foreground : colors.mutedForeground },
                      theme === 'light' && styles.segmentActiveText,
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    theme === 'dark' && [styles.segmentActiveButton, { backgroundColor: colors.card }],
                  ]}
                  onPress={() => theme !== 'dark' && toggleTheme()}
                  activeOpacity={0.8}
                >
                  <Moon size={15} color={theme === 'dark' ? '#FFC700' : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: theme === 'dark' ? colors.foreground : colors.mutedForeground },
                      theme === 'dark' && styles.segmentActiveText,
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Navigation List */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {menuSections.map((section, secIdx) => (
                <View key={section.title} style={[styles.sectionContainer, secIdx > 0 && { marginTop: 18 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                    {section.title}
                  </Text>
                  <View style={styles.sectionItems}>
                    {section.items.map((item) => {
                      const IconComp = item.icon;
                      const isActive = currentRouteName === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.navItem,
                            isActive && {
                              backgroundColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.06)' : 'rgba(255, 199, 0, 0.08)',
                              borderColor: theme === 'dark' ? 'rgba(255, 199, 0, 0.15)' : 'rgba(255, 199, 0, 0.25)',
                            },
                          ]}
                          onPress={() => handleNavigate(item.id)}
                          activeOpacity={0.7}
                        >
                          {isActive && (
                            <View style={[styles.activeIndicator, { backgroundColor: '#FFC700' }]} />
                          )}
                          <View
                            style={[
                              styles.iconWrapper,
                              {
                                backgroundColor: isActive
                                  ? 'rgba(255, 199, 0, 0.15)'
                                  : colors.secondary,
                              },
                            ]}
                          >
                            <IconComp
                              size={18}
                              color={isActive ? '#FFC700' : colors.mutedForeground}
                            />
                          </View>
                          <View style={styles.navLabelContainer}>
                            <Text
                              style={[
                                styles.navLabel,
                                { color: isActive ? '#FFC700' : colors.foreground },
                                isActive && styles.activeNavLabel,
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text style={[styles.navSubtitle, { color: colors.mutedForeground }]}>
                              {item.subtitle}
                            </Text>
                          </View>
                          <ChevronRight
                            size={15}
                            color={isActive ? '#FFC700' : 'rgba(148, 163, 184, 0.3)'}
                            style={styles.chevronIcon}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
              {/* Status card */}
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <View style={styles.statusHeaderRow}>
                  <ShieldCheck size={14} color="#10B981" />
                  <Text style={[styles.statusCardTitle, { color: colors.foreground }]}>
                    Secure Bidding Hub
                  </Text>
                </View>
                <Text style={[styles.statusCardDesc, { color: colors.mutedForeground }]}>
                  Live auctions are end-to-end encrypted.
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  glowCircleTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  glowCircleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  drawerHeader: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
    marginTop: 10,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#FFC700',
    fontSize: 9,
    fontWeight: '900',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    marginTop: 10,
  },
  themeRow: {
    marginHorizontal: 18,
    marginTop: 14,
    zIndex: 1,
  },
  themeTitleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  segmentActiveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentActiveText: {
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
    marginVertical: 8,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  sectionContainer: {
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionItems: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    borderTopRightRadius: 2.5,
    borderBottomRightRadius: 2.5,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  navLabelContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  navLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  activeNavLabel: {
    fontWeight: '800',
  },
  navSubtitle: {
    fontSize: 10.5,
    fontWeight: '400',
    marginTop: 1,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  drawerFooter: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 8,
    zIndex: 1,
  },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusCardTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusCardDesc: {
    fontSize: 9.5,
    fontWeight: '400',
  },
  primaryActionBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryActionBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
