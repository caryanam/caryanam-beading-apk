import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, RefreshCw, Gavel, Zap, Trophy, TrendingUp, Car, ChevronRight } from 'lucide-react-native';
import { dealerService } from '../services/dealerService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { DealerNotificationsModal } from '../components/DealerNotificationsModal';

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

// Ported from web src/lib/utils.ts (same as AdminVehiclesScreen)
function parseDateStringToLocal(inputStr: string): Date | null {
  const trimmed = inputStr.trim();
  if (!trimmed) return null;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
  if (isoMatch) {
    const [, y, mo, d, h, mi, s, msRaw] = isoMatch;
    const ms = parseInt(((msRaw || '0').slice(0, 3)).padEnd(3, '0'), 10);
    return new Date(+y, +mo - 1, +d, +h, +mi, +s, ms);
  }
  if (trimmed.includes('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function formatParsedDate(date: Date): string {
  const exactTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0 || diffMs < 10000) return `Just now (${exactTime.toLowerCase()})`;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let relative = '';
  if (diffMin <= 1) relative = '1 min ago';
  else if (diffMin < 60) relative = `${diffMin} mins ago`;
  else if (diffHr < 24) relative = `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  else if (diffDay < 7) relative = `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  else relative = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${relative} (${exactTime.toLowerCase()})`;
}

function formatIndianDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return 'N/A';
  if (input instanceof Date) return isNaN(input.getTime()) ? 'N/A' : formatParsedDate(input);
  if (typeof input === 'number') { const d = new Date(input); return isNaN(d.getTime()) ? 'N/A' : formatParsedDate(d); }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return 'N/A';
    const parsed = parseDateStringToLocal(trimmed);
    if (parsed && !isNaN(parsed.getTime())) return formatParsedDate(parsed);
    return trimmed;
  }
  return 'N/A';
}

type TabKey = 'all' | 'live' | 'won' | 'lost';

interface DealerBidsScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const DealerBidsScreen: React.FC<DealerBidsScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const fetchBids = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const res = await dealerService.getBidsHistory();
      if (res.success && res.data) setBids(res.data);
      if (showMsg) showToast({ message: 'Bids history refreshed', type: 'success' });
    } catch {
      if (showMsg) showToast({ message: 'Could not load bids history.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalBidsCount = bids.length;
  const liveBidsCount = useMemo(() => bids.filter((b) => b.auction === 'live').length, [bids]);
  const wonBidsCount = useMemo(
    () => bids.filter((b) => b.auction !== 'live' && Number(b.myBid) >= Number(b.highestBid)).length,
    [bids],
  );
  const lostBidsCount = useMemo(
    () => bids.filter((b) => b.auction !== 'live' && Number(b.myBid) < Number(b.highestBid)).length,
    [bids],
  );
  const totalBidValue = useMemo(() => bids.reduce((acc, b) => acc + (Number(b.myBid) || 0), 0), [bids]);

  const filteredBids = useMemo(() => {
    if (activeTab === 'live') return bids.filter((b) => b.auction === 'live');
    if (activeTab === 'won') return bids.filter((b) => b.auction !== 'live' && Number(b.myBid) >= Number(b.highestBid));
    if (activeTab === 'lost') return bids.filter((b) => b.auction !== 'live' && Number(b.myBid) < Number(b.highestBid));
    return bids;
  }, [bids, activeTab]);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All Bids', count: totalBidsCount },
    { key: 'live', label: 'Live', count: liveBidsCount },
    { key: 'won', label: 'Won', count: wonBidsCount },
    { key: 'lost', label: 'Lost', count: lostBidsCount },
  ];

  const statCards = [
    { label: 'Total Bids Placed', value: String(totalBidsCount), icon: Gavel, color: '#FFC700', bg: 'rgba(255,199,0,0.12)' },
    { label: 'Active Auctions', value: String(liveBidsCount), icon: Zap, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Bids Won', value: String(wonBidsCount), icon: Trophy, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Bid Value', value: inr(totalBidValue), icon: TrendingUp, color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  ];

  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const rowBg = isDark ? 'rgba(255,255,255,0.04)' : '#F2F4FA';

  const goToVehicle = (v: any) => {
    navigation.navigate('DealerVehicleDetail', { vehicleId: v.vehicleId || v.id || v.inspectionId });
  };

  const renderEmpty = (msg: string, sub: string) => (
    <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: cardBg }]}>
      <View style={styles.emptyIcon}>
        <Gavel size={22} color="#FFC700" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{msg}</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>{sub}</Text>
      {bids.length === 0 && (
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('DealerMarketplace')}
          activeOpacity={0.85}
        >
          <Car size={14} color="#0D0E12" />
          <Text style={styles.browseBtnText}>Browse Marketplace</Text>
        </TouchableOpacity>
      )}
      {bids.length > 0 && activeTab !== 'all' && (
        <TouchableOpacity
          style={[styles.allBtn, { backgroundColor: rowBg, borderColor: colors.border }]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.85}
        >
          <Text style={[styles.allBtnText, { color: colors.foreground }]}>View All Bids ({totalBidsCount})</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Gavel size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Bids</Text>
          {!loading && totalBidsCount > 0 && (
            <View style={[styles.countPill, { backgroundColor: 'rgba(255,199,0,0.12)', borderColor: 'rgba(255,199,0,0.3)' }]}>
              <Text style={styles.countPillText}>{totalBidsCount} Total</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightActions}>
          <DealerNotificationsModal navigation={navigation} iconColor={colors.foreground} />
          <TouchableOpacity onPress={() => fetchBids(true)} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBids(true)} tintColor="#FFC700" />}
      >
        <View style={styles.contentBody}>
          {/* Stat cards */}
          <View style={styles.statsGrid}>
            {statCards.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <View key={idx} style={[styles.statCard, { backgroundColor: s.bg, borderColor: colors.border }]}>
                  <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                    <IconComp size={15} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
                    {loading ? '...' : s.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Section header + tabs */}
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bidding History</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {tabs.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setActiveTab(t.key)}
                  style={[
                    styles.tabBtn,
                    isActive && { backgroundColor: isDark ? '#FFC700' : '#0D0E12' },
                    !isActive && { backgroundColor: cardBg, borderColor: colors.border },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabText, { color: isActive ? (isDark ? '#0D0E12' : '#FFFFFF') : colors.mutedForeground }]}>
                    {t.label} ({t.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bid list */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFC700" size="large" />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your bids history...</Text>
            </View>
          ) : bids.length === 0 ? (
            renderEmpty('You have not placed any bids yet.', 'Visit the marketplace to browse live vehicle auctions and start placing your bids.')
          ) : filteredBids.length === 0 ? (
            renderEmpty(`No bids found for "${activeTab}" filter.`, 'Try switching tabs to view all your placed bids.')
          ) : (
            <View style={styles.listContainer}>
              {filteredBids.map((v, idx) => {
                const isLive = v.auction === 'live';
                const isWin = !isLive && Number(v.myBid) >= Number(v.highestBid);
                return (
                  <View key={idx} style={[styles.bidCard, { backgroundColor: cardBg, borderColor: isLive ? 'rgba(16,185,129,0.5)' : colors.border }]}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => goToVehicle(v)}>
                      <View style={styles.bidCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.bidVehicleRow}>
                            <Text style={[styles.bidVehicle, { color: colors.foreground }]} numberOfLines={1}>
                              {v.brand} {v.model}
                            </Text>
                            {isLive && (
                              <View style={styles.livePill}>
                                <View style={styles.liveDot} />
                                <Text style={styles.livePillText}>LIVE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.bidRegNo, { color: colors.mutedForeground }]}>{v.regNo || '—'}</Text>
                        </View>
                        <ChevronRight size={16} color="rgba(148,163,184,0.4)" />
                      </View>

                      <View style={[styles.bidStatsRow, { borderTopColor: colors.border, backgroundColor: rowBg }]}>
                        <View style={styles.bidStat}>
                          <Text style={[styles.bidStatLabel, { color: colors.mutedForeground }]}>My Bid</Text>
                          <Text style={[styles.bidStatValue, { color: colors.foreground }]}>{inr(Number(v.myBid))}</Text>
                        </View>
                        <View style={styles.bidStatDivider} />
                        <View style={styles.bidStat}>
                          <Text style={[styles.bidStatLabel, { color: colors.mutedForeground }]}>Highest Bid</Text>
                          <Text style={[styles.bidStatValue, { color: colors.mutedForeground }]}>{inr(Number(v.highestBid))}</Text>
                        </View>
                        <View style={styles.bidStatDivider} />
                        <View style={styles.bidStat}>
                          <Text style={[styles.bidStatLabel, { color: colors.mutedForeground }]}>Bid Time</Text>
                          <Text style={[styles.bidTimeValue, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {formatIndianDateTime(v.timestamp)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.bidCardFooter, { borderTopColor: colors.border }]}>
                        {isLive ? (
                          <View style={[styles.statusChip, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                            <Text style={[styles.statusChipText, { color: '#10B981' }]}>LIVE AUCTION</Text>
                          </View>
                        ) : isWin ? (
                          <View style={[styles.statusChip, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
                            <Text style={[styles.statusChipText, { color: '#3B82F6' }]}>WON</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusChip, { backgroundColor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.3)' }]}>
                            <Text style={[styles.statusChipText, { color: '#F43F5E' }]}>LOST</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.bidActionBtn}
                          onPress={() => goToVehicle(v)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.bidActionText}>{isLive ? 'Increase Bid' : 'View Vehicle'}</Text>
                          {isLive && <Zap size={12} color="#0D0E12" />}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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
  countPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  countPillText: { fontSize: 8.5, fontWeight: '900', color: '#FFC700' },

  contentBody: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  statCard: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
  statIconWrapper: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  sectionHeader: { borderBottomWidth: 1, paddingBottom: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  tabsRow: { gap: 8, paddingBottom: 14 },
  tabBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  tabText: { fontSize: 11, fontWeight: '800' },

  loadingContainer: { paddingVertical: 60, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },

  emptyCard: { borderWidth: 1.5, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,199,0,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  emptySub: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFC700', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11, marginTop: 12 },
  browseBtnText: { fontSize: 11, fontWeight: '900', color: '#0D0E12' },
  allBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11, marginTop: 12 },
  allBtnText: { fontSize: 11, fontWeight: '800' },

  listContainer: { gap: 12 },
  bidCard: { borderRadius: 16, borderWidth: 1.2, overflow: 'hidden' },
  bidCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 },
  bidVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bidVehicle: { fontSize: 14, fontWeight: '900', letterSpacing: -0.2, flexShrink: 1 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  livePillText: { fontSize: 8.5, fontWeight: '900', color: '#10B981' },
  bidRegNo: { fontSize: 10.5, fontWeight: '700', marginTop: 2 },

  bidStatsRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14 },
  bidStat: { flex: 1 },
  bidStatDivider: { width: 1, backgroundColor: 'rgba(148,163,184,0.2)', marginHorizontal: 10 },
  bidStatLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  bidStatValue: { fontSize: 12, fontWeight: '900', marginTop: 2 },
  bidTimeValue: { fontSize: 10, fontWeight: '700', marginTop: 3 },

  bidCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1 },
  statusChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statusChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  bidActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFC700', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  bidActionText: { fontSize: 10.5, fontWeight: '900', color: '#0D0E12' },
});