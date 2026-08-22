import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, RefreshCw, Heart, ChevronRight, Clock, Gauge, Fuel, Cog, User } from 'lucide-react-native';
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

const mapFavourite = (item: any): any => {
  const basePrice = item.suggestedPrice || 350000;
  const highestBid = item.currentHighestBid || 0;

  let fuel = 'Petrol';
  const f = (item.fuel || '').toLowerCase();
  if (f.includes('diesel')) fuel = 'Diesel';
  else if (f.includes('cng')) fuel = 'CNG';
  else if (f.includes('electric') || f.includes('ev')) fuel = 'Electric';

  let transmission = 'Manual';
  const t = (item.transmission || '').toLowerCase();
  if (t.includes('auto')) transmission = 'Automatic';

  const status = item.vehicleStatus || '';
  let auction = 'scheduled' as string;
  if (status === 'LIVE') auction = 'live';
  else if (status === 'SOLD OUT' || status === 'SOLD_OUT' || status === 'SOLD') auction = 'sold out';
  else if (status === 'ENDED' || status === 'AUCTION ENDED' || status === 'AUCTION_ENDED') auction = 'ended';

  return {
    id: String(item.inspectionId),
    inspectionId: item.inspectionId,
    regNo: item.vehicleNumber,
    brand: item.brand,
    model: item.model,
    variant: item.variant,
    year: item.year || 2020,
    fuel,
    transmission,
    odometer: item.odometer ?? 0,
    owner: item.ownerName || '1st Owner',
    basePrice,
    highestBid,
    bids: item.totalBids || 0,
    auction,
    image: item.vehicleImage || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
    endsAt: item.auctionEndTime || Date.now() + 86400000,
    raw: item,
  };
};

interface DealerFavouritesScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const DealerFavouritesScreen: React.FC<DealerFavouritesScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [favourites, setFavourites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavourites = useCallback(async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const res = await dealerService.getWishlist();
      if (res.success && res.data) setFavourites(res.data.map(mapFavourite));
      if (showMsg) showToast({ message: 'Watchlist refreshed', type: 'success' });
    } catch {
      setFavourites([]);
      if (showMsg) showToast({ message: 'Could not load watchlist.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFavourites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (v: any) => {
    setRemovingId(v.id);
    try {
      const res = await dealerService.removeFromWishlist(Number(v.inspectionId) || Number(v.id));
      if (res.success) {
        setFavourites((prev) => prev.filter((item) => item.id !== v.id));
        showToast({ message: 'Removed from watchlist.', type: 'success' });
      } else {
        showToast({ message: res.message || 'Could not update watchlist.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Could not update watchlist.', type: 'error' });
    } finally {
      setRemovingId(null);
    }
  };

  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  const VehicleMiniCard = ({ v }: { v: any }) => {
    const isLive = v.auction === 'live';
    const isComingSoon = v.auction === 'scheduled';
    const isSoldOut = v.auction === 'sold out';
    const isEnded = v.auction === 'ended';
    const [timeRemaining, setTimeRemaining] = React.useState(timeLeft(v.endsAt));
    React.useEffect(() => {
      setTimeRemaining(timeLeft(v.endsAt));
      const id = setInterval(() => setTimeRemaining(timeLeft(v.endsAt)), 1000);
      return () => clearInterval(id);
    }, [v.endsAt]);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: isLive ? 'rgba(16,185,129,0.5)' : (isComingSoon ? 'rgba(99,102,241,0.4)' : colors.border),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const isFreelancerVehicle =
              v.isFreelancer ||
              v.sourceType === 'FREELANCER' ||
              v.inspector?.toLowerCase().includes('freelancer') ||
              !!v.freelancerName ||
              !!(v as any).raw?.freelancerName;
            
            if (isFreelancerVehicle) {
              navigation.navigate('DealerFreelancerVehicleDetail', { vehicleId: v.inspectionId || v.id });
            } else {
              navigation.navigate('DealerVehicleDetail', { vehicleId: v.inspectionId || v.id });
            }
          }}
        >
          <View style={styles.imageWrap}>
            <Image source={{ uri: v.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageOverlay} />
            {isLive ? (
              <View style={styles.liveBadge}>
                <View style={styles.livePing} />
                <Text style={styles.liveBadgeText}>LIVE AUCTION</Text>
              </View>
            ) : isComingSoon ? (
              <View style={styles.soonBadge}>
                <Clock size={10} color="#FFFFFF" />
                <Text style={styles.soonBadgeText}>COMING SOON</Text>
              </View>
            ) : (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED LISTING</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.heartBtn, removingId === v.id && styles.heartBtnDisabled]}
              onPress={() => handleRemove(v)}
              disabled={removingId !== null}
              activeOpacity={0.8}
            >
              {removingId === v.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Heart size={15} color="#F43F5E" fill="#F43F5E" />
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.specsBar, { backgroundColor: isDark ? '#171A24' : '#FFFFFF' }]}>
            <View style={styles.specCell}>
              <Gauge size={12} color="#FFC700" />
              <View>
                <Text style={[styles.specVal, { color: colors.foreground }]}>{v.odometer ? v.odometer : 'N/A'}</Text>
                <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Mileage</Text>
              </View>
            </View>
            <View style={styles.specCell}>
              <Fuel size={12} color="#FFC700" />
              <View>
                <Text style={[styles.specVal, { color: colors.foreground }]}>{v.fuel}</Text>
                <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Fuel Type</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{v.brand} {v.model}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{v.year} Model • {v.variant || 'Standard'}</Text>

            <View style={styles.specsGrid}>
              <View style={[styles.specBox, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
                <Cog size={11} color="#FFC700" />
                <View>
                  <Text style={[styles.specBoxVal, { color: colors.foreground }]}>{v.transmission === 'Automatic' ? 'Auto' : 'Manual'}</Text>
                  <Text style={[styles.specBoxLabel, { color: colors.mutedForeground }]}>Transmission</Text>
                </View>
              </View>
              <View style={[styles.specBox, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
                <User size={11} color="#FFC700" />
                <View>
                  <Text style={[styles.specBoxVal, { color: colors.foreground }]} numberOfLines={1}>{v.owner}</Text>
                  <Text style={[styles.specBoxLabel, { color: colors.mutedForeground }]}>Owner Type</Text>
                </View>
              </View>
            </View>

            <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>ACTUAL PRICE</Text>
                <Text style={[styles.priceValue, { color: colors.mutedForeground }]}>{inr(v.basePrice)}</Text>
              </View>
              <View>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                  {isSoldOut ? 'WINNING BID' : 'HIGHEST BID'}
                </Text>
                <Text style={[styles.priceValue, { color: isLive ? '#10B981' : colors.foreground }]}>
                  {isComingSoon || !v.highestBid || v.bids === 0 ? 'No Bids' : inr(v.highestBid)}
                </Text>
              </View>
              <View style={styles.ctaWrap}>
                {isLive ? (
                  <View style={styles.bidNowBtn}>
                    <Text style={styles.bidNowText}>BID NOW</Text>
                  </View>
                ) : isSoldOut ? (
                  <View style={styles.soldChip}>
                    <Text style={styles.soldChipText}>SOLD OUT</Text>
                  </View>
                ) : isEnded ? (
                  <View style={styles.endedChip}>
                    <Text style={[styles.endedChipText, { color: colors.mutedForeground }]}>ENDED</Text>
                  </View>
                ) : (
                  <View style={styles.scheduledPill}>
                    {timeRemaining !== 'Ended' && (
                      <Text style={styles.scheduledText}>IN {timeRemaining}</Text>
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Heart size={15} color="#F43F5E" fill="#F43F5E" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Favourites</Text>
          {!loading && favourites.length > 0 && (
            <View style={[styles.countPill, { backgroundColor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.3)' }]}>
              <Text style={styles.countPillText}>{favourites.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightActions}>
          <DealerNotificationsModal navigation={navigation} iconColor={colors.foreground} />
          <TouchableOpacity onPress={() => fetchFavourites(true)} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your watchlist...</Text>
        </View>
      ) : favourites.length === 0 ? (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFavourites(true)} tintColor="#FFC700" />}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Heart size={22} color="#F43F5E" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your watchlist is empty.</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap the heart button on any vehicle details page to save it here.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('DealerMarketplace')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFavourites(true)} tintColor="#FFC700" />}
        >
          {favourites.map((v) => (
            <VehicleMiniCard key={v.id} v={v} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  countPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  countPillText: { fontSize: 8.5, fontWeight: '900', color: '#F43F5E' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 60, gap: 8 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(244,63,94,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 17 },
  browseBtn: { backgroundColor: '#FFC700', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 12 },
  browseBtnText: { fontSize: 11.5, fontWeight: '900', color: '#0D0E12' },

  listContainer: { padding: 14, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 18, borderWidth: 1.2, overflow: 'hidden' },
  imageWrap: { position: 'relative', height: 150 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)' },
  liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#059669', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  livePing: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  liveBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  soonBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6366F1', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  soonBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  verifiedBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  verifiedBadgeText: { color: '#059669', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  heartBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  heartBtnDisabled: { opacity: 0.7 },

  specsBar: { flexDirection: 'row', marginHorizontal: 10, marginTop: -14, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  specCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  specVal: { fontSize: 10.5, fontWeight: '800' },
  specLabel: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase' },

  cardBody: { padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  cardSub: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  specsGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  specBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  specBoxVal: { fontSize: 10.5, fontWeight: '800' },
  specBoxLabel: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase' },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 8 },
  priceLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  priceValue: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  ctaWrap: { alignItems: 'flex-end' },
  bidNowBtn: { backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  bidNowText: { color: '#0D0E12', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.3 },
  soldChip: { backgroundColor: 'rgba(244,63,94,0.15)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.35)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  soldChipText: { color: '#F43F5E', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  endedChip: { backgroundColor: 'rgba(148,163,184,0.12)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  endedChipText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  scheduledPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scheduledText: { color: '#FFC700', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 },
});