import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap,
  Trophy,
  Car,
  Gavel,
  Heart,
  ChevronRight,
  Menu,
  RefreshCw,
  ShieldCheck,
  Store,
  Clock,
  Gauge,
  Fuel,
  Cog,
  ArrowRight,
  TrendingUp,
  User,
  CheckCircle2,
} from 'lucide-react-native';
import { dealerService } from '../services/dealerService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { DealerNotificationsModal } from '../components/DealerNotificationsModal';

interface DealerDashboardScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

const timeLeft = (endsAt?: number): string => {
  if (!endsAt) return 'Ended';
  const diff = endsAt - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
};

const mapVehicle = (v: any): any => {
  const basePrice = v.suggestedPrice || 350000;
  const highestBid = v.currentHighestBid && v.currentHighestBid > 0 ? v.currentHighestBid : 0;

  let fuel = 'Petrol';
  const f = (v.fuel || '').toLowerCase();
  if (f.includes('diesel')) fuel = 'Diesel';
  else if (f.includes('cng')) fuel = 'CNG';
  else if (f.includes('lpg')) fuel = 'LPG';
  else if (f.includes('electric') || f.includes('ev')) fuel = 'Electric';
  else if (f.includes('hybrid')) fuel = 'Hybrid';

  let transmission = 'Manual';
  const t = (v.transmission || '').toLowerCase();
  if (t.includes('auto')) transmission = 'Automatic';

  const isLive = v.vehicleStatus === 'LIVE';
  const isSold = ['SOLD OUT', 'SOLD', 'ENDED', 'COMPLETED', 'AUCTION ENDED', 'SOLD_OUT'].includes(v.vehicleStatus);

  return {
    inspectionId: v.inspectionId,
    image:
      v.vehicleImage ||
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    brand: v.brand,
    model: v.model,
    variant: v.variant,
    year: v.year || 2020,
    fuel,
    transmission,
    odometer: v.odometer ?? 0,
    owner: v.ownerName || '1st Owner',
    basePrice,
    highestBid,
    bids: v.totalBids || 0,
    auction: isLive ? 'live' : (isSold ? 'sold out' : 'scheduled'),
    endsAt: v.auctionEndTime || undefined,
    regNo: v.vehicleNumber,
  };
};

const PingDot: React.FC = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={styles.pingWrap}>
      <Animated.View style={[styles.pingRing, { opacity, transform: [{ scale }] }]} />
      <View style={styles.pingCore} />
    </View>
  );
};

interface DashboardVehicleCardProps {
  v: any;
  navigation: any;
  colors: any;
  isDark: boolean;
  isFavourite: boolean;
  onToggleFavourite: (id: number) => void;
}

const DashboardVehicleCard: React.FC<DashboardVehicleCardProps> = ({ v, navigation, colors, isDark, isFavourite, onToggleFavourite }) => {
  const isLive = v.auction === 'live';
  const isComingSoon = v.auction === 'scheduled';
  const isEnded = v.auction === 'ended';
  const isSoldOut = v.auction === 'sold out';
  const [timeRemaining, setTimeRemaining] = useState(timeLeft(v.endsAt));

  useEffect(() => {
    setTimeRemaining(timeLeft(v.endsAt));
    const id = setInterval(() => setTimeRemaining(timeLeft(v.endsAt)), 1000);
    return () => clearInterval(id);
  }, [v.endsAt]);

  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const specsBg = isDark ? '#171A24' : '#FFFFFF';

  return (
    <View
      style={[
        styles.invCard,
        {
          backgroundColor: cardBg,
          borderColor: isLive ? 'rgba(16,185,129,0.5)' : (isComingSoon ? 'rgba(99,102,241,0.4)' : colors.border),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DealerVehicleDetail', { vehicleId: v.inspectionId })}
      >
        {/* Image */}
        <View style={styles.invImageWrap}>
          <Image source={{ uri: v.image }} style={styles.invImage} resizeMode="cover" />
          <View style={styles.invImageOverlay} />
          {isLive ? (
            <View style={styles.invLiveBadge}>
              <PingDot />
              <Text style={styles.invLiveText}>LIVE AUCTION</Text>
            </View>
          ) : isComingSoon ? (
            <View style={styles.invSoonBadge}>
              <Clock size={10} color="#FFFFFF" />
              <Text style={styles.invSoonText}>COMING SOON</Text>
            </View>
          ) : (
            <View style={styles.invVerifiedBadge}>
              <CheckCircle2 size={11} color="#059669" />
              <Text style={styles.invVerifiedText}>VERIFIED LISTING</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.invHeartBtn, isFavourite && styles.invHeartBtnFav]}
            onPress={() => onToggleFavourite(v.inspectionId)}
            activeOpacity={0.8}
          >
            <Heart size={15} color={isFavourite ? '#FFFFFF' : '#FFFFFF'} fill={isFavourite ? '#FFFFFF' : 'transparent'} />
          </TouchableOpacity>
        </View>

        {/* Floating 2-specs bar */}
        <View style={[styles.invSpecsBar, { backgroundColor: specsBg, borderColor: colors.border }]}>
          <View style={[styles.invSpecCell, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
            <Gauge size={12} color="#FFC700" />
            <View>
              <Text style={[styles.invSpecVal, { color: colors.foreground }]}>{v.odometer ? v.odometer : 'N/A'}</Text>
              <Text style={[styles.invSpecLabel, { color: colors.mutedForeground }]}>Mileage</Text>
            </View>
          </View>
          <View style={[styles.invSpecCell, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
            <Fuel size={12} color="#FFC700" />
            <View>
              <Text style={[styles.invSpecVal, { color: colors.foreground }]}>{v.fuel}</Text>
              <Text style={[styles.invSpecLabel, { color: colors.mutedForeground }]}>Fuel Type</Text>
            </View>
          </View>
        </View>

        {/* Card content */}
        <View style={styles.invBody}>
          <Text style={[styles.invTitle, { color: colors.foreground }]} numberOfLines={1}>
            {v.brand} {v.model}
          </Text>
          <Text style={[styles.invSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {v.year} Model • {v.variant || 'Standard'}
          </Text>

          {/* Bottom 2-specs grid */}
          <View style={styles.invSpecsGrid}>
            <View style={[styles.invSpecBox, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
              <Cog size={11} color="#FFC700" />
              <View>
                <Text style={[styles.invSpecBoxVal, { color: colors.foreground }]}>{v.transmission === 'Automatic' ? 'Auto' : 'Manual'}</Text>
                <Text style={[styles.invSpecBoxLabel, { color: colors.mutedForeground }]}>Transmission</Text>
              </View>
            </View>
            <View style={[styles.invSpecBox, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
              <User size={11} color="#FFC700" />
              <View>
                <Text style={[styles.invSpecBoxVal, { color: colors.foreground }]} numberOfLines={1}>{v.owner}</Text>
                <Text style={[styles.invSpecBoxLabel, { color: colors.mutedForeground }]}>Owner Type</Text>
              </View>
            </View>
          </View>

          {/* Pricing footer */}
          <View style={[styles.invPriceRow, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.invPriceLabel, { color: colors.mutedForeground }]}>ACTUAL PRICE</Text>
              <Text style={[styles.invPriceValue, { color: colors.mutedForeground }]}>{inr(v.basePrice)}</Text>
            </View>
            <View>
              <Text style={[styles.invPriceLabel, { color: colors.mutedForeground }]}>
                {isSoldOut ? 'WINNING BID' : 'HIGHEST BID'}
              </Text>
              <Text style={[styles.invPriceValue, { color: isLive ? '#10B981' : colors.foreground }]}>
                {isComingSoon || !v.highestBid || v.bids === 0 ? 'No Bids' : inr(v.highestBid)}
              </Text>
            </View>
            <View style={styles.invCtaWrap}>
              {isLive ? (
                <View style={styles.invBidNowBtn}>
                  <Text style={styles.invBidNowText}>BID NOW</Text>
                </View>
              ) : isSoldOut ? (
                <View style={styles.invSoldChip}>
                  <Text style={styles.invSoldText}>SOLD OUT</Text>
                </View>
              ) : isEnded ? (
                <View style={styles.invEndedChip}>
                  <Text style={[styles.invEndedText, { color: colors.mutedForeground }]}>ENDED</Text>
                </View>
              ) : (
                <View style={styles.invScheduledPill}>
                  {timeRemaining !== 'Ended' && (
                    <Text style={styles.invScheduledText}>IN {timeRemaining}</Text>
                  )}
                  <ChevronRight size={13} color="#FFC700" />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const DealerDashboardScreen: React.FC<DealerDashboardScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

// Data States
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bidsCount, setBidsCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [wonBidsCount, setWonBidsCount] = useState(0);
  const [dealerName, setDealerName] = useState('Valued Dealer');
  const [dealershipName, setDealershipName] = useState('');

  const fetchDashboardData = async () => {
    try {
      const session = await authService.getStoredSession();
      if (session) {
        setDealerName(session.name || (session.email ? session.email.split('@')[0] : 'Valued Dealer'));
      }

      const [marketRes, wishlistRes, bidsRes, profileRes] = await Promise.all([
        dealerService.getMarketplace(),
        dealerService.getWishlist(),
        dealerService.getBidsHistory(),
        dealerService.getProfile(),
      ]);

      if (marketRes.success && marketRes.data) setVehicles(marketRes.data);
      if (wishlistRes.success && wishlistRes.data) {
        setFavCount(wishlistRes.data.length);
        setFavIds(new Set(wishlistRes.data.map((w: any) => w.inspectionId || w.id)));
      }
      if (bidsRes.success && bidsRes.data) setBidsCount(bidsRes.data.length);
      if (profileRes.success && profileRes.data) {
        setWonBidsCount((profileRes.data as any).wonBidsCount || 0);
        setDealershipName((profileRes.data as any).dealershipName || '');
      }
    } catch (err: any) {
      console.error('Failed to load dealer dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleFavourite = async (id: number) => {
    try {
      const next = new Set(favIds);
      if (next.has(id)) {
        await dealerService.removeFromWishlist(id);
        next.delete(id);
      } else {
        await dealerService.addToWishlist(id);
        next.add(id);
      }
      setFavIds(next);
      setFavCount(next.size);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Live vs Upcoming lists
  const liveRooms = useMemo(() => vehicles.filter((v) => v.vehicleStatus === 'LIVE'), [vehicles]);
  const upcomingRooms = useMemo(() => {
    return vehicles.filter((v) => {
      const status = v.vehicleStatus;
      return status && status !== 'LIVE' && status !== 'SOLD OUT' && status !== 'SOLD' && status !== 'ENDED' && status !== 'COMPLETED' && status !== 'AUCTION ENDED';
    });
  }, [vehicles]);

  const featured = useMemo(() => liveRooms[0] || upcomingRooms[0] || null, [liveRooms, upcomingRooms]);

  const [remaining, setRemaining] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!featured?.auctionEndTime) return;
    const endsAt = featured.auctionEndTime;
    const tick = () => setRemaining(timeLeft(endsAt));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [featured?.auctionEndTime]);

  const featuredStatus = featured?.vehicleStatus === 'LIVE';
  const featuredHighestBid = featured?.currentHighestBid || 0;
  const featuredPrice = featured?.suggestedPrice || 0;

  const mappedVehicles = useMemo(() => vehicles.map(mapVehicle), [vehicles]);
  const recommended = useMemo(() => mappedVehicles.slice(0, 3), [mappedVehicles]);

  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : '#F2F4FA';

  const kpis = [
    { label: 'Live Bidding Rooms', value: liveRooms.length, delta: 'Active bidding sessions', bg: 'rgba(16,185,129,0.12)', color: '#10B981', icon: Zap },
    { label: 'Auctions Won', value: wonBidsCount, delta: 'Assigned won vehicles', bg: 'rgba(255,199,0,0.12)', color: '#FFC700', icon: Trophy },
    { label: 'Upcoming Auctions', value: upcomingRooms.length, delta: 'Coming Soon rooms', bg: 'rgba(99,102,241,0.12)', color: '#818CF8', icon: Car },
    { label: 'My Bids Placed', value: bidsCount, delta: 'Total active & past bids', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', icon: Gavel },
    { label: 'My Watchlist', value: favCount, delta: 'Saved favourite vehicles', bg: 'rgba(244,63,94,0.12)', color: '#F43F5E', icon: Heart },
  ];

  const shortcuts = [
    { label: 'Live Marketplace', desc: `${liveRooms.length} active bidding rooms`, bg: 'rgba(16,185,129,0.12)', color: '#10B981', icon: Zap, screen: 'DealerMarketplace' },
    { label: 'My Placed Bids', desc: `${bidsCount} total submitted bids`, bg: 'rgba(255,199,0,0.12)', color: '#FFC700', icon: Gavel, screen: 'DealerBids' },
    { label: 'Saved Watchlist', desc: `${favCount} saved vehicles`, bg: 'rgba(244,63,94,0.12)', color: '#F43F5E', icon: Heart, screen: 'DealerFavourites' },
    { label: 'Dealer Profile', desc: dealershipName || 'Manage dealership settings', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', icon: Store, screen: 'DealerProfile' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Store size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dealer</Text>
          {liveRooms.length > 0 && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>{liveRooms.length} Live</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightActions}>
          <DealerNotificationsModal navigation={navigation} iconColor={colors.foreground} />
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
      >
        <View style={styles.contentBody}>
          {/* Supercar Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeGlow} />
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeLeft}>
                <View style={styles.welcomeIconContainer}>
                  <Zap size={22} color="#0D0E12" fill="#0D0E12" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeTitle}>Welcome, {dealerName}</Text>
                  <Text style={styles.welcomeSubtitle} numberOfLines={2}>
                    Live Auctions Active · {liveRooms.length} Bidding Rooms Online · {vehicles.length} Vehicles Inspected
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.welcomeCta}
                onPress={() => navigation.navigate('DealerMarketplace')}
                activeOpacity={0.85}
              >
                <Text style={styles.welcomeCtaText}>Explore Marketplace</Text>
                <ChevronRight size={14} color="#0D0E12" />
              </TouchableOpacity>
            </View>
          </View>

          {/* KPI Stat cards */}
          <View style={styles.kpiGrid}>
            {kpis.map((k, idx) => {
              const IconComp = k.icon;
              return (
                <TouchableOpacity
                  key={k.label}
                  style={[styles.kpiCard, idx === kpis.length - 1 ? styles.kpiCardFull : null, { backgroundColor: cardBg, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const screen = idx === 0 ? 'DealerMarketplace' : idx === 1 ? 'DealerBids' : idx === 2 ? 'DealerMarketplace' : idx === 3 ? 'DealerBids' : 'DealerFavourites';
                    navigation.navigate(screen);
                  }}
                >
                  <View style={[styles.kpiIconBg, { backgroundColor: k.bg }]}>
                    <IconComp size={16} color={k.color} />
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.foreground }]}>{loading ? '...' : k.value}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.foreground }]}>{k.label}</Text>
                  <View style={styles.kpiDeltaRow}>
                    <TrendingUp size={10} color={k.color} />
                    <Text style={[styles.kpiDelta, { color: colors.mutedForeground }]} numberOfLines={1}>{k.delta}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Featured Bidding Room */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.panelHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelLabel, { color: colors.mutedForeground }]}>FEATURED BIDDING ROOM</Text>
                <Text style={[styles.panelTitleText, { color: colors.foreground }]} numberOfLines={1}>
                  {featured ? `${featured.brand} ${featured.model} ${featured.variant}` : 'Real-time auction stream'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('DealerMarketplace')} style={styles.browseAllBtn} activeOpacity={0.7}>
                <Text style={[styles.browseAllText, { color: colors.foreground }]}>Browse All</Text>
                <ChevronRight size={13} color="#FFC700" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 30 }} />
            ) : !featured ? (
              <View style={styles.emptyFeaturedView}>
                <Text style={[styles.emptyFeaturedText, { color: colors.mutedForeground }]}>
                  No auctions currently running live or coming soon.
                </Text>
              </View>
) : (
              <View style={styles.featuredDarkBox}>
                <View style={styles.featuredRadial} />
                <View style={styles.featuredInner}>
                  <View style={styles.featuredPriceRow}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.featuredTopBadge, { alignSelf: 'flex-start', backgroundColor: featuredStatus ? 'rgba(16,185,129,0.15)' : 'rgba(255,199,0,0.15)' }]}>
                        {featuredStatus ? (
                          <View style={styles.featuredBadgeRow}>
                            <PingDot />
                            <Text style={[styles.featuredBadgeText, { color: '#34D399' }]}>LIVE BIDDING ACTIVE</Text>
                          </View>
                        ) : (
                          <View style={styles.featuredBadgeRow}>
                            <Zap size={10} color="#FFC700" fill="#FFC700" />
                            <Text style={[styles.featuredBadgeText, { color: '#FFC700' }]}>COMING SOON</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.featuredPrice}>
                        {featuredStatus && featuredHighestBid ? inr(featuredHighestBid) : featuredPrice ? inr(featuredPrice) : 'No Bids Yet'}
                      </Text>
                      <Text style={styles.featuredVehicle} numberOfLines={1}>
                        {featured.brand} {featured.model} {featured.variant}
                      </Text>
                    </View>
                    <View style={styles.featuredMetaCol}>
                      {featuredStatus && featured.auctionEndTime ? (
                        <View style={styles.featuredTimer}>
                          <Text style={styles.featuredTimerLabel}>CLOSES IN</Text>
                          <Text style={styles.featuredTimerValue}>{remaining}</Text>
                        </View>
                      ) : (
                        <View style={styles.featuredTimer}>
                          <Text style={styles.featuredTimerLabel}>STATUS</Text>
                          <Text style={styles.featuredTimerValue}>SCHEDULED</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.featuredActionBtn}
                    onPress={() => navigation.navigate('DealerVehicleDetail', { vehicleId: featured.inspectionId })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.featuredActionText}>
                      {featuredStatus ? 'Enter Live Bidding Room' : 'View Vehicle Inspection Report'}
                    </Text>
                    <ArrowRight size={14} color="#0D0E12" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Recommended Vehicle Inventory */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border, marginTop: 18 }]}>
            <View style={styles.panelHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelLabel, { color: colors.mutedForeground }]}>CURATED FOR YOU</Text>
                <Text style={[styles.panelTitleText, { color: colors.foreground }]}>Recommended Vehicle Inventory</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('DealerMarketplace')} style={styles.browseAllBtn} activeOpacity={0.7}>
                <Text style={[styles.browseAllText, { color: colors.foreground }]}>View All</Text>
                <ChevronRight size={13} color="#FFC700" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 30 }} />
            ) : recommended.length === 0 ? (
              <View style={styles.emptyFeaturedView}>
                <Text style={[styles.emptyFeaturedText, { color: colors.mutedForeground }]}>
                  No recommended inventory reports available.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.invRow}>
                {recommended.map((v) => (
                  <DashboardVehicleCard
                    key={v.inspectionId}
                    v={v}
                    navigation={navigation}
                    colors={colors}
                    isDark={isDark}
                    isFavourite={favIds.has(v.inspectionId)}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Dealer Shortcuts */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border, marginTop: 18 }]}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Dealer Shortcuts</Text>
            <View style={styles.shortcutList}>
              {shortcuts.map((s, idx) => {
                const IconComp = s.icon;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.shortcutItem, { backgroundColor: rowBg, borderColor: colors.border }]}
                    onPress={() => navigation.navigate(s.screen)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.shortcutIconBg, { backgroundColor: s.bg }]}>
                      <IconComp size={16} color={s.color} />
                    </View>
                    <View style={styles.shortcutContent}>
                      <Text style={[styles.shortcutLabel, { color: colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.shortcutDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                    </View>
                    <ChevronRight size={16} color="rgba(148,163,184,0.4)" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Verification Guarantee */}
          <View style={[styles.guaranteeCard, { backgroundColor: 'rgba(255,199,0,0.08)', borderColor: 'rgba(255,199,0,0.25)' }]}>
            <View style={styles.guaranteeHeader}>
              <ShieldCheck size={20} color="#FFC700" />
              <Text style={styles.guaranteeTitle}>Certified 200-Point Inspection</Text>
            </View>
            <Text style={[styles.guaranteeText, { color: colors.foreground }]}>
              Every vehicle on Caryanam Bidding is thoroughly evaluated by certified engineers with verified structural, engine, and document reports.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveBadgeText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
  contentBody: { padding: 16, paddingBottom: 40 },

  welcomeBanner: {
    backgroundColor: '#0D0E12',
    borderWidth: 1.2,
    borderColor: 'rgba(255,199,0,0.35)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  welcomeGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,199,0,0.14)',
  },
  welcomeContent: { gap: 14 },
  welcomeLeft: { flexDirection: 'row', alignItems: 'center' },
  welcomeIconContainer: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#FFC700', justifyContent: 'center', alignItems: 'center', marginRight: 13, shadowColor: '#FFC700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  welcomeTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  welcomeSubtitle: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 3, lineHeight: 15 },
  welcomeCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFC700', borderRadius: 13, paddingVertical: 12,
    shadowColor: '#FFC700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  welcomeCtaText: { color: '#0D0E12', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  kpiCard: { width: '48%', borderWidth: 1, borderRadius: 18, padding: 14 },
  kpiCardFull: { width: '100%' },
  kpiIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  kpiDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  kpiDelta: { fontSize: 10, fontWeight: '600', flex: 1 },

  panel: { borderWidth: 1, borderRadius: 22, padding: 18 },
  panelTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 },
  panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 },
  panelLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  panelTitleText: { fontSize: 15, fontWeight: '900' },
  browseAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  browseAllText: { fontSize: 10.5, fontWeight: '800' },
  emptyFeaturedView: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyFeaturedText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

featuredDarkBox: { backgroundColor: '#0D0E12', borderWidth: 1, borderColor: 'rgba(255,199,0,0.4)', borderRadius: 20, padding: 20, overflow: 'hidden' },
  featuredRadial: { position: 'absolute', top: -60, right: -45, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,199,0,0.16)' },
  featuredInner: { position: 'relative', zIndex: 1 },
  featuredTopBadge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  featuredBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredBadgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6 },
  pingWrap: { width: 8, height: 8 },
  pingRing: { position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  pingCore: { position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },

  featuredPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14, gap: 10 },
  featuredPrice: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 10 },
  featuredVehicle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  featuredMetaCol: { alignItems: 'flex-end', gap: 8 },
  featuredTimer: { alignItems: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,199,0,0.4)', backgroundColor: 'rgba(255,199,0,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  featuredTimerLabel: { fontSize: 8, fontWeight: '900', color: '#FFC700', letterSpacing: 0.5 },
featuredTimerValue: { fontSize: 15, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  featuredActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFC700', borderRadius: 14, paddingVertical: 13, marginTop: 16, shadowColor: '#FFC700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
  featuredActionText: { color: '#0D0E12', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  invRow: { gap: 12, paddingRight: 4 },
  invCard: { width: 252, borderRadius: 18, borderWidth: 1.2, overflow: 'hidden' },
  invImageWrap: { position: 'relative', height: 130 },
  invImage: { width: '100%', height: '100%' },
  invImageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)' },
  invLiveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#059669', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  invLiveText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  invSoonBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  invSoonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  invVerifiedBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  invVerifiedText: { color: '#059669', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  invHeartBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  invHeartBtnFav: { backgroundColor: '#F43F5E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  invSpecsBar: { flexDirection: 'row', marginHorizontal: 10, marginTop: -14, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  invSpecCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  invSpecVal: { fontSize: 10.5, fontWeight: '800' },
  invSpecLabel: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase' },
  invBody: { padding: 12 },
  invTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  invSub: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  invSpecsGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  invSpecBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  invSpecBoxVal: { fontSize: 10.5, fontWeight: '800' },
  invSpecBoxLabel: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase' },
  invPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 8 },
  invPriceLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  invPriceValue: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  invCtaWrap: { alignItems: 'flex-end' },
  invBidNowBtn: { backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  invBidNowText: { color: '#0D0E12', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.3 },
  invSoldChip: { backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.35)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  invSoldText: { color: '#F43F5E', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  invEndedChip: { backgroundColor: 'rgba(148,163,184,0.12)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  invEndedText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  invScheduledPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  invScheduledText: { color: '#FFC700', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 },

  shortcutList: { gap: 10 },
  shortcutItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 12 },
  shortcutIconBg: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  shortcutContent: { flex: 1 },
  shortcutLabel: { fontSize: 13, fontWeight: '800' },
  shortcutDesc: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  guaranteeCard: { borderWidth: 1.2, borderRadius: 20, padding: 16, marginTop: 18 },
  guaranteeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  guaranteeTitle: { fontSize: 13, fontWeight: '900', color: '#FFC700' },
  guaranteeText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
});

