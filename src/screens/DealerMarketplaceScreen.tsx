import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Search, RefreshCw, X, Clock, Heart, Gauge, Fuel, Cog, User, ChevronRight, Filter, ChevronDown, CheckCircle2, MapPin, Star } from 'lucide-react-native';
import { dealerService } from '../services/dealerService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { DealerNotificationsModal } from '../components/DealerNotificationsModal';

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

const getTimerParts = (endsAt?: number) => {
  if (!endsAt) return { hours: '00', minutes: '00', seconds: '00' };
  const diff = endsAt - Date.now();
  if (diff <= 0) return { hours: '00', minutes: '00', seconds: '00' };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
};

const uniq = (list: string[]) => ['All', ...Array.from(new Set(list))];

const mapVehicle = (v: any): any => {
  const basePrice = v.suggestedPrice || v.price || v.basePrice || 0;
  const highestBid = v.currentHighestBid && v.currentHighestBid > 0 ? v.currentHighestBid : 0;

  let fuel = v.fuelType || v.fuel || 'Petrol';
  const f = fuel.toLowerCase();
  if (f.includes('diesel')) fuel = 'Diesel';
  else if (f.includes('cng')) fuel = 'CNG';
  else if (f.includes('lpg')) fuel = 'LPG';
  else if (f.includes('hybrid')) fuel = 'Hybrid';
  else if (f.includes('electric') || f.includes('ev')) fuel = 'Electric';

  let transmission = v.transmission || 'Manual';
  const t = transmission.toLowerCase();
  if (t.includes('auto')) transmission = 'Automatic';

  const status = v.vehicleStatus || v.status || '';
  let auction = 'scheduled' as string;
  if (status === 'LIVE') auction = 'live';
  else if (status === 'SOLD OUT' || status === 'SOLD_OUT' || status === 'SOLD') auction = 'sold out';
  else if (status === 'ENDED' || status === 'AUCTION ENDED' || status === 'AUCTION_ENDED') auction = 'ended';

  const location = v.location || v.city || v.place || '';
  const rtoInfo = v.rtoInformation || v.rto || (v.vehicleNumber ? v.vehicleNumber.slice(0, 6) : '');
  const engineRating = v.engineRating || v.overallRating || v.rating || (v.inspectionRating ? String(v.inspectionRating) : '');

  return {
    id: String(v.inspectionId || v.id),
    inspectionId: v.inspectionId || v.id,
    regNo: v.vehicleNumber || v.regNo || '',
    brand: v.brand || '',
    model: v.model || '',
    variant: v.variant || '',
    year: v.year || v.manufacturingYear || v.registrationYear || '',
    fuel,
    transmission,
    odometer: v.odometerReading ?? v.odometer ?? null,
    owner: v.ownerName || v.owner || '',
    location,
    rtoInformation: rtoInfo,
    engineRating,
    score: v.inspectionScore || v.score || 0,
    basePrice,
    highestBid,
    bids: v.totalBids || v.bids || 0,
    auction,
    image: v.vehicleImage || v.imageUrl || v.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    endsAt: v.auctionEndTime || v.endsAt || undefined,
    inspector: v.inspectorName || v.evaluator || '',
  };
};

interface DealerMarketplaceScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const DealerMarketplaceScreen: React.FC<DealerMarketplaceScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('All');
  const [fuel, setFuel] = useState('All');
  const [transmission, setTransmission] = useState('All');
  const [status, setStatus] = useState('All');
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const fetchMarketplace = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const [marketRes, wishlistRes] = await Promise.all([
        dealerService.getMarketplace(),
        dealerService.getWishlist(),
      ]);
      if (marketRes.success && marketRes.data) {
        setInspections(marketRes.data);
        if (showMsg) showToast({ message: 'Marketplace refreshed', type: 'success' });
      }
      if (wishlistRes.success && wishlistRes.data) {
        setFavIds(new Set(wishlistRes.data.map((w: any) => w.inspectionId || w.id)));
      }
    } catch {
      if (showMsg) showToast({ message: 'Could not load marketplace vehicles.', type: 'error' });
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
    } catch {
      showToast({ message: 'Could not update watchlist.', type: 'error' });
    }
  };

  useEffect(() => {
    fetchMarketplace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => fetchMarketplace(true);

  const mappedVehicles = useMemo(() => inspections.map(mapVehicle), [inspections]);

const statusOptions = [
  { key: 'All', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'scheduled', label: 'Coming Soon' },
  { key: 'sold out', label: 'Sold Out' },
  { key: 'ended', label: 'Auction Ended' },
];

const filtered = useMemo(() => {
    return mappedVehicles.filter(
      (v) =>
        (brand === 'All' || v.brand === brand) &&
        (fuel === 'All' || v.fuel === fuel) &&
        (transmission === 'All' || v.transmission === transmission) &&
        (status === 'All' || v.auction === status) &&
        `${v.brand} ${v.model} ${v.variant} ${v.regNo}`.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [mappedVehicles, query, brand, fuel, transmission, status]);

  const selects = [
    { label: 'Brand', value: brand, set: setBrand, options: uniq(mappedVehicles.map((v) => v.brand)) },
    { label: 'Fuel', value: fuel, set: setFuel, options: uniq(mappedVehicles.map((v) => v.fuel)) },
    { label: 'Transmission', value: transmission, set: setTransmission, options: uniq(mappedVehicles.map((v) => v.transmission)) },
    { label: 'Status', value: status, set: setStatus, options: statusOptions.map((o) => o.key) },
  ];

  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Marketplace</Text>
          {filtered.length > 0 && <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>({filtered.length})</Text>}
        </View>
        <View style={styles.headerRightActions}>
          <DealerNotificationsModal navigation={navigation} iconColor={colors.foreground} />
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0D0E12' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
          <Search size={14} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search brand, model, registration no..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <X size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

{/* Filter selects */}
        <View style={styles.filterRow}>
          {selects.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.filterSelect, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: s.value !== 'All' ? 'rgba(255,199,0,0.5)' : colors.border }]}
              onPress={() => setOpenFilter(openFilter === s.label ? null : s.label)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterSelectLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              <Text style={[styles.filterSelectValue, { color: colors.foreground }]} numberOfLines={1}>
                {s.label === 'Status'
                  ? (statusOptions.find((st) => st.key === s.value)?.label || s.value)
                  : s.value}
              </Text>
              <ChevronDown size={14} color={s.value !== 'All' ? '#FFC700' : colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filter dropdown modal */}
      <Modal visible={openFilter !== null} transparent animationType="fade" onRequestClose={() => setOpenFilter(null)}>
        <TouchableOpacity style={styles.filterBackdrop} activeOpacity={1} onPress={() => setOpenFilter(null)}>
          <View style={[styles.filterDropdown, { backgroundColor: isDark ? '#171A24' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={[styles.filterDropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.filterDropdownTitle, { color: colors.foreground }]}>
                Select {openFilter}
              </Text>
              <TouchableOpacity onPress={() => setOpenFilter(null)} activeOpacity={0.7}>
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {selects
              .find((s) => s.label === openFilter)
              ?.options.map((o) => {
                const active = selects.find((s) => s.label === openFilter)?.value === o;
                const display = openFilter === 'Status'
                  ? (statusOptions.find((st) => st.key === o)?.label || o)
                  : o;
                return (
                  <TouchableOpacity
                    key={o}
                    style={[styles.filterOption, { backgroundColor: active ? 'rgba(255,199,0,0.12)' : 'transparent' }]}
                    onPress={() => {
                      selects.find((s) => s.label === openFilter)?.set(o);
                      setOpenFilter(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, { color: active ? '#FFC700' : colors.foreground }]}>
                      {display}
                    </Text>
                    {active && <CheckCircle2 size={15} color="#FFC700" />}
                  </TouchableOpacity>
                );
              })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading marketplace...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}>
          <View style={styles.emptyContainer}>
            <Filter size={32} color="#FFC700" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vehicles match your filters</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Try adjusting your brand, fuel type or transmission filter settings.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
{filtered.map((v) => (
            <MarketplaceVehicleCard
              key={v.id}
              v={v}
              navigation={navigation}
              colors={colors}
              isDark={isDark}
              cardBg={cardBg}
              isFavourite={favIds.has(v.inspectionId)}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

interface MarketplaceVehicleCardProps {
  v: any;
  navigation: any;
  colors: any;
  isDark: boolean;
  cardBg: string;
  isFavourite: boolean;
  onToggleFavourite: (id: number) => void;
}
const MarketplaceVehicleCard: React.FC<MarketplaceVehicleCardProps> = ({ v, navigation, colors, isDark, cardBg, isFavourite, onToggleFavourite }) => {
  const isLive = v.auction === 'live';
  const isComingSoon = v.auction === 'scheduled';
  const isSoldOut = v.auction === 'sold out';
  const isEnded = v.auction === 'ended';
  const [timerParts, setTimerParts] = useState(getTimerParts(v.endsAt));

  useEffect(() => {
    setTimerParts(getTimerParts(v.endsAt));
    const id = setInterval(() => setTimerParts(getTimerParts(v.endsAt)), 1000);
    return () => clearInterval(id);
  }, [v.endsAt]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DealerVehicleDetail', { vehicleId: v.inspectionId })}
      >
        {/* Top Image Section */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: v.image }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay} />

          {/* Status Badges (Top-Left) */}
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.livePing} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          ) : isComingSoon ? (
            <View style={styles.soonBadge}>
              <Clock size={10} color="#FFFFFF" />
              <Text style={styles.soonBadgeText}>COMING SOON</Text>
            </View>
          ) : (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          )}

          {/* Heart Wishlist Button (Top-Right) */}
          <TouchableOpacity
            style={[styles.heartBtn, isFavourite && styles.heartBtnFav]}
            onPress={() => onToggleFavourite(v.inspectionId)}
            activeOpacity={0.8}
          >
            <Heart size={15} color="#FFFFFF" fill={isFavourite ? '#FFFFFF' : 'transparent'} />
          </TouchableOpacity>

          {/* Location Badge Pill (Dynamic) */}
          {(v.location || v.rtoInformation) ? (
            <View style={styles.locationPill}>
              <MapPin size={11} color="#FFFFFF" />
              <Text style={styles.locationPillText} numberOfLines={1}>
                {v.location && v.rtoInformation
                  ? `${v.location} • ${v.rtoInformation}`
                  : v.location || v.rtoInformation}
              </Text>
            </View>
          ) : null}

          {/* Carousel Indicators (Bottom-Right: • • •) */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Header Row: Title & Engine Rating Pill */}
          <View style={styles.titleRow}>
            <Text style={[styles.yearBrandModel, { color: colors.mutedForeground }]}>
              {[v.year, v.brand, v.model].filter(Boolean).join(' ')}
            </Text>
            {v.engineRating ? (
              <View style={styles.engineRatingPill}>
                <Text style={styles.engineRatingText}>ENGINE {v.engineRating}</Text>
                <Star size={10} color="#10B981" fill="#10B981" />
              </View>
            ) : null}
          </View>

          {/* Variant Line (Bold, Uppercase - Dynamic) */}
          <Text style={[styles.variantTitle, { color: colors.foreground }]} numberOfLines={1}>
            {(v.variant || `${v.brand} ${v.model}`).toUpperCase()}
          </Text>

          {/* Spec Line: Odometer • Owner • Fuel (Dynamic) */}
          <Text style={[styles.specInlineText, { color: colors.mutedForeground }]}>
            {[
              v.odometer ? `${Number(v.odometer).toLocaleString('en-IN')} km` : null,
              v.owner || null,
              v.fuel || null,
            ].filter(Boolean).join(' • ')}
          </Text>

          {/* Dashed Separator Line */}
          <View style={[styles.dashedLine, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }]} />

          {/* Bottom Pricing & Digital Countdown Row */}
          <View style={styles.cardBottomRow}>
            <View>
              <Text style={[styles.bidPriceLabel, { color: colors.mutedForeground }]}>
                {isSoldOut ? 'Winning Bid' : 'Highest Bid'}
              </Text>
              <Text style={[styles.bidPriceValue, { color: colors.foreground }]}>
                {inr(v.highestBid > 0 ? v.highestBid : v.basePrice)}
              </Text>
            </View>

            {/* Digital Countdown Box or Status Chip */}
            {isLive ? (
              <View style={[styles.digitalTimerBox, { backgroundColor: isDark ? '#231D2A' : '#FCE8EF' }]}>
                <View style={styles.timerSegment}>
                  <Text style={[styles.timerDigit, { color: isDark ? '#FFC700' : '#111827' }]}>
                    {timerParts.hours}
                  </Text>
                  <Text style={[styles.timerUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}>
                    hr
                  </Text>
                </View>

                <View style={[styles.timerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' }]} />

                <View style={styles.timerSegment}>
                  <Text style={[styles.timerDigit, { color: isDark ? '#FFC700' : '#111827' }]}>
                    {timerParts.minutes}
                  </Text>
                  <Text style={[styles.timerUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}>
                    min
                  </Text>
                </View>

                <View style={[styles.timerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' }]} />

                <View style={styles.timerSegment}>
                  <Text style={[styles.timerDigit, { color: isDark ? '#FFC700' : '#111827' }]}>
                    {timerParts.seconds}
                  </Text>
                  <Text style={[styles.timerUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}>
                    sec
                  </Text>
                </View>
              </View>
            ) : isComingSoon ? (
              <View style={[styles.soldChip, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                <Text style={[styles.soldChipText, { color: '#818CF8' }]}>COMING SOON</Text>
              </View>
            ) : isSoldOut ? (
              <View style={styles.soldChip}>
                <Text style={styles.soldChipText}>SOLD OUT</Text>
              </View>
            ) : (
              <View style={styles.endedChip}>
                <Text style={[styles.endedChipText, { color: colors.mutedForeground }]}>ENDED</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  headerCount: { fontSize: 12, fontWeight: '700' },

  searchContainer: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', padding: 0 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterSelect: { width: '48.5%', flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, gap: 5 },
  filterSelectLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  filterSelectValue: { flex: 1, fontSize: 12, fontWeight: '800' },
  filterBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  filterDropdown: { width: '100%', maxWidth: 340, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  filterDropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  filterDropdownTitle: { fontSize: 14, fontWeight: '900' },
  filterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  filterOptionText: { fontSize: 13, fontWeight: '700' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  listContainer: { padding: 14, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 18, borderWidth: 1.2, overflow: 'hidden' },
  imageWrap: { position: 'relative', height: 180 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' },
  liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#059669', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  livePing: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  soonBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  soonBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  verifiedBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  verifiedBadgeText: { color: '#059669', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  heartBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  heartBtnFav: { backgroundColor: '#F43F5E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },

  locationPill: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  locationPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  dotsRow: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 6, height: 6, borderRadius: 3 },

  cardBody: { padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  yearBrandModel: { fontSize: 13, fontWeight: '700' },
  engineRatingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  engineRatingText: { color: '#10B981', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 },
  variantTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2, marginTop: 1 },
  specInlineText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  dashedLine: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 12 },

  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bidPriceLabel: { fontSize: 11, fontWeight: '700' },
  bidPriceValue: { fontSize: 18, fontWeight: '900', marginTop: 1 },

  digitalTimerBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 8 },
  timerSegment: { alignItems: 'center' },
  timerDigit: { fontSize: 14, fontWeight: '900', lineHeight: 16 },
  timerUnit: { fontSize: 9, fontWeight: '800' },
  timerDivider: { width: 1, height: 18 },

  soldChip: { backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.35)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  soldChipText: { color: '#F43F5E', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  endedChip: { backgroundColor: 'rgba(148,163,184,0.12)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  endedChipText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
});
