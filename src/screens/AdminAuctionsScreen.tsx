import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  RefreshCw,
  Gavel,
  Tag,
  Flame,
  CheckCircle2,
  Clock,
  Crown,
  PlayCircle,
  Square,
  X,
  AlertTriangle,
  Radio,
  BadgeIndianRupee,
  Activity,
  Copy,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { freelancerService } from '../services/freelancerService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

// ── Helpers ──────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────

interface AdminAuctionsScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const AdminAuctionsScreen: React.FC<AdminAuctionsScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspector' | 'freelancer'>('inspector');
  const [inspections, setInspections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setNow] = useState(Date.now());
  const [goLiveLoading, setGoLiveLoading] = useState<number | null>(null);
  const [markSoldLoading, setMarkSoldLoading] = useState<number | null>(null);
  const [stopping, setStopping] = useState(false);

  // Stop auction modal
  const [stopModal, setStopModal] = useState<{
    visible: boolean;
    auctionId: number | null;
    vehicleName: string;
  }>({ visible: false, auctionId: null, vehicleName: '' });

  // Real-time tick for live countdowns
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Data Fetching ──────────────────────────────────────

  const fetchAuctions = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    setLoading(true);
    try {
      if (activeTab === 'inspector') {
        const res = await adminService.getSubmittedInspections();
        if (res.success && res.data) {
          const approvedOnly = res.data.filter((ins: any) => {
            const s = String(ins.status || ins.vehicleStatus || '').toUpperCase();
            return s === 'APPROVED' || s === 'READY_FOR_AUCTION' || s === 'LIVE' || s === 'SOLD' || s === 'SOLD OUT' || s === 'COMPLETED';
          });
          setInspections(approvedOnly);
          if (showMsg) showToast({ message: 'Inspector auctions list updated', type: 'success' });
        } else {
          setInspections([]);
        }
      } else {
        const res = await freelancerService.getMyInspections();
        if (res.success && res.data) {
          const processed = res.data
            .filter((ins: any) => {
              const s = String(ins.status || ins.vehicleStatus || '').toUpperCase();
              return s === 'APPROVED' || s === 'READY_FOR_AUCTION' || s === 'LIVE' || s === 'SOLD' || s === 'SOLD OUT' || s === 'COMPLETED';
            })
            .map((item: any) => ({
              ...item,
              inspectionId: item.inspectionId || item.id,
              vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || `INS-${item.inspectionId || item.id}`,
              brand: item.brand || '',
              model: item.model || '',
              variant: item.variant || '',
              ownerName: item.ownerName || '1st Owner',
              suggestedPrice: item.suggestedPrice || item.price || 0,
              submittedAt: item.submittedAt || item.createdAt || null,
              inspectorName: item.freelancerName || item.inspectorName || item.inspector?.fullName || (item.inspectorId ? `Freelancer #${item.inspectorId}` : 'N/A'),
              status: item.status || item.vehicleStatus || 'APPROVED',
              vehicleStatus: item.vehicleStatus || item.status || 'READY_FOR_AUCTION',
            }));
          setInspections(processed);
          if (showMsg) showToast({ message: 'Freelancer auctions list updated', type: 'success' });
        } else {
          setInspections([]);
        }
      }
    } catch {
      // silent fetch error log
      setInspections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const onRefresh = () => fetchAuctions(true);

  // ── Actions ────────────────────────────────────────────

  const handleCopyPublicLink = (id: number, name: string) => {
    const link = `https://caryanamlive.com/public-bid/${id}`;
    Clipboard.setString(link);
    showToast({ message: `Public Bidding Link copied for ${name}!`, type: 'success' });
  };

  const handleGoLive = async (id: number) => {
    setGoLiveLoading(id);
    try {
      const duration = activeTab === 'freelancer' ? 15 : 30;
      showToast({ message: `Launching live ${duration}-minute auction room...`, type: 'info' });
      const res = await adminService.startLiveAuction(id, duration);
      if (res.success) {
        showToast({ message: `${duration}-Minute Live Auction Started for Vehicle #${id}!`, type: 'success' });
        fetchAuctions();
      } else {
        showToast({ message: 'Failed to start auction.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error setting auction to live.', type: 'error' });
    } finally {
      setGoLiveLoading(null);
    }
  };

  const handleStopAuction = async () => {
    if (!stopModal.auctionId) return;
    setStopping(true);
    try {
      showToast({ message: `Stopping auction for ${stopModal.vehicleName}...`, type: 'info' });
      const res = await adminService.stopLiveAuction(stopModal.auctionId);
      if (res.success) {
        showToast({ message: `Auction stopped for ${stopModal.vehicleName}.`, type: 'success' });
        fetchAuctions();
      } else {
        showToast({ message: 'Failed to stop auction.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to stop auction.', type: 'error' });
    } finally {
      setStopping(false);
      setStopModal({ visible: false, auctionId: null, vehicleName: '' });
    }
  };

  const handleMarkSoldOut = async (id: number, name: string) => {
    setMarkSoldLoading(id);
    try {
      const res = await adminService.updateInspectionVehicleStatus(id, 'SOLD OUT');
      if (res.success) {
        showToast({ message: `${name} marked as SOLD OUT!`, type: 'success' });
        fetchAuctions();
      } else {
        showToast({ message: 'Failed to update status.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to update status.', type: 'error' });
    } finally {
      setMarkSoldLoading(null);
    }
  };

  // ── Metrics ────────────────────────────────────────────

  const metrics = useMemo(() => {
    const total = inspections.length;
    const liveCount = inspections.filter((i) => i.vehicleStatus === 'LIVE').length;
    const totalBidsCount = inspections.reduce((acc: number, i: any) => acc + (i.totalBids || 0), 0);
    const soldCount = inspections.filter(
      (i) => i.vehicleStatus === 'SOLD OUT' || i.vehicleStatus === 'SOLD' || i.vehicleStatus === 'ENDED'
    ).length;
    return { total, liveCount, totalBidsCount, soldCount };
  }, [inspections]);

  // ── Search & Filter ────────────────────────────────────

  const filtered = inspections.filter((ins) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [
      ins.brand || '', ins.model || '', ins.variant || '',
      ins.vehicleNumber || '', ins.currentHighestBidder || '',
    ].join(' ').toLowerCase().includes(q);
  });

  // ── Status Helpers ─────────────────────────────────────

  const getVehicleStatusMeta = (vs: string) => {
    if (vs === 'LIVE') return { label: 'Live Room', color: '#10B981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', pulse: true };
    if (vs === 'SOLD OUT' || vs === 'SOLD') return { label: 'Sold Out', color: '#F43F5E', bg: 'rgba(244,63,94,0.13)', border: 'rgba(244,63,94,0.3)', pulse: false };
    if (vs === 'ENDED' || vs === 'AUCTION ENDED' || vs === 'AUCTION_ENDED' || vs === 'COMPLETED') return { label: 'Auction Ended', color: '#94A3B8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.3)', pulse: false };
    return { label: 'Ready to Launch', color: '#F59E0B', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.3)', pulse: false };
  };

  // Theme-aware card colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const cardHeaderBg = isDark ? '#1A1D28' : '#EEF0F6';
  const specPanelBg  = isDark ? '#0F111A' : '#E8EBF3';
  const specBorder   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,110,140,0.15)';
  const footerBg     = isDark ? '#0D0E14' : '#F2F4FA';

  // ── Render ─────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Gavel size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Auctions</Text>
          {metrics.liveCount > 0 && (
            <View style={styles.liveBadge}>
              <Radio size={9} color="#FFC700" />
              <Text style={styles.liveBadgeText}>{metrics.liveCount} Live</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightActions}>
          <AdminNotificationsModal />
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderRadius: 20, marginHorizontal: 16, marginTop: 12, marginBottom: 8, padding: 4 }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: activeTab === 'inspector' ? '#FFC700' : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('inspector')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'inspector' ? '#0D0E12' : colors.mutedForeground }}>Inspectors</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: activeTab === 'freelancer' ? '#FFC700' : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('freelancer')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'freelancer' ? '#0D0E12' : colors.mutedForeground }}>Freelancers</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0D0E12' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search auctions by brand, model, winner..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading auctions...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >

          {/* 4 Metric Cards */}
          <View style={styles.metricsGrid}>
            {/* Approved Vehicles */}
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>APPROVED</Text>
                <Tag size={13} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{metrics.total}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Ready for Auction</Text>
            </View>

            {/* Live Rooms */}
            <View style={[styles.metricCard, { backgroundColor: 'rgba(255,199,0,0.07)', borderColor: 'rgba(255,199,0,0.3)' }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: '#FFC700' }]}>LIVE ROOMS</Text>
                <Flame size={13} color="#FFC700" />
              </View>
              <Text style={[styles.metricValue, { color: '#FFC700' }]}>{metrics.liveCount}</Text>
              <Text style={[styles.metricSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>Real-time Bidding</Text>
            </View>

            {/* Total Bids */}
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>LIVE BIDS</Text>
                <Gavel size={13} color="#10B981" />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{metrics.totalBidsCount}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Dealer Activity</Text>
            </View>

            {/* Sold / Completed */}
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>SOLD / ENDED</Text>
                <CheckCircle2 size={13} color="#F43F5E" />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{metrics.soldCount}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Concluded</Text>
            </View>
          </View>

          {/* Auction Cards */}
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertTriangle size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Auctions Found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                No approved vehicles available for auction management.
              </Text>
            </View>
          ) : (
            filtered.map((v) => {
              const vs = v.vehicleStatus || '';
              const statusMeta = getVehicleStatusMeta(vs);
              const isLive = vs === 'LIVE';
              const isSold = vs === 'SOLD OUT' || vs === 'SOLD';
              const isEnded = vs === 'ENDED' || vs === 'AUCTION ENDED' || vs === 'AUCTION_ENDED' || vs === 'COMPLETED';
              const bidCount = v.totalBids || 0;
              const topBid = v.currentHighestBid || v.suggestedPrice || 0;
              const winnerName = v.currentHighestBidder || 'No Bids';
              const vehicleName = `${v.brand} ${v.model}`;

              return (
                <View
                  key={v.inspectionId}
                  style={[
                    styles.card,
                    {
                      backgroundColor: cardBg,
                      borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)',
                      elevation: isDark ? 4 : 3,
                      shadowColor: isDark ? statusMeta.color : '#8090B0',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.25 : 0.12,
                      shadowRadius: 10,
                    },
                  ]}
                >
                  {/* Glow circles */}
                  <View style={[styles.cardGlowTop, { backgroundColor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.10)' }]} />
                  <View style={[styles.cardGlowBottom, { backgroundColor: isDark ? 'rgba(255,199,0,0.04)' : 'rgba(255,199,0,0.07)' }]} />

                  {/* Left accent */}
                  <View style={[styles.leftAccent, { backgroundColor: statusMeta.color }]} />

                  {/* Card Header */}
                  <View style={[styles.cardHeader, { backgroundColor: cardHeaderBg }]}>
                    <View style={styles.headerLeft}>
                      <View style={styles.regPill}>
                        <Text style={styles.regPillText}>{v.vehicleNumber || '—'}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
                      {statusMeta.pulse && <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />}
                      <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.vehicleName, { color: colors.foreground }]}>{vehicleName}</Text>
                    <Text style={[styles.vehicleVariant, { color: colors.mutedForeground }]}>Variant: {v.variant || 'Standard'}</Text>

                    {/* Spec Panel */}
                    <View style={[styles.specPanel, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                      {/* Row 1: Valuation + Highest Bid */}
                      <View style={styles.specRow}>
                        <View style={styles.specCell}>
                          <View style={[styles.specIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                            <BadgeIndianRupee size={9} color="#10B981" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>VALUATION</Text>
                            <Text style={[styles.specVal, { color: '#10B981' }]}>{v.suggestedPrice ? inr(v.suggestedPrice) : 'N/A'}</Text>
                          </View>
                        </View>
                        <View style={[styles.specDivider, { backgroundColor: specBorder }]} />
                        <View style={styles.specCell}>
                          <View style={[styles.specIcon, { backgroundColor: isLive ? 'rgba(255,199,0,0.12)' : 'rgba(255,199,0,0.08)' }]}>
                            <Gavel size={9} color={isLive ? '#FFC700' : colors.mutedForeground} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>HIGHEST BID</Text>
                            <Text style={[styles.specVal, { color: isLive ? '#FFC700' : colors.foreground }]}>{inr(topBid)}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={[styles.specHDivider, { backgroundColor: specBorder }]} />

                      {/* Row 2: Winner + Timer */}
                      <View style={styles.specRow}>
                        <View style={styles.specCell}>
                          <View style={styles.specIcon}>
                            <Crown size={9} color="#FFC700" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>WINNER</Text>
                            <Text style={[styles.specVal, { color: colors.foreground }]} numberOfLines={1}>{winnerName} ({bidCount} Bids)</Text>
                          </View>
                        </View>
                        <View style={[styles.specDivider, { backgroundColor: specBorder }]} />
                        <View style={styles.specCell}>
                          <View style={[styles.specIcon, { backgroundColor: isLive ? 'rgba(255,199,0,0.15)' : undefined }]}>
                            <Clock size={9} color={isLive ? '#FFC700' : colors.mutedForeground} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>TIMER</Text>
                            <Text style={[styles.specVal, {
                              color: isLive
                                ? ((v.auctionEndTime || Date.now() + (activeTab === 'freelancer' || v.sourceType === 'FREELANCER' ? 15 : 30) * 60000) - Date.now() <= 120000 ? '#F43F5E' : '#FFC700')
                                : colors.foreground,
                            }]}>
                              {isLive
                                ? timeLeft(v.auctionEndTime || Date.now() + (activeTab === 'freelancer' || v.sourceType === 'FREELANCER' ? 15 : 30) * 60000)
                                : isSold || isEnded
                                  ? 'Completed'
                                  : (activeTab === 'freelancer' || v.sourceType === 'FREELANCER' ? '15m (Ready)' : '30m (Ready)')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Card Footer — actions */}
                  <View style={[styles.cardFooter, { backgroundColor: footerBg, borderTopColor: specBorder }]}>

                    {/* View Details */}
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => navigation.navigate('AdminAuctionDetail', { inspectionId: v.inspectionId })}
                      activeOpacity={0.75}
                    >
                      <Activity size={12} color={colors.foreground} />
                      <Text style={[styles.detailsBtnText, { color: colors.foreground }]}>Details</Text>
                    </TouchableOpacity>

                    {/* LIVE: Copy Public Link + Monitor + Stop */}
                    {isLive && (
                      <>
                        <TouchableOpacity
                          style={styles.copyLinkBtn}
                          onPress={() => handleCopyPublicLink(v.inspectionId, vehicleName)}
                          activeOpacity={0.75}
                        >
                          <Copy size={12} color="#3B82F6" />
                          <Text style={styles.copyLinkText}>Copy Public Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.monitorBtn}
                          onPress={() => navigation.navigate('AdminLiveBidding')}
                          activeOpacity={0.75}
                        >
                          <Activity size={12} color="#FFC700" />
                          <Text style={styles.monitorBtnText}>Monitor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stopBtn}
                          onPress={() => setStopModal({ visible: true, auctionId: v.inspectionId, vehicleName })}
                          disabled={stopping}
                          activeOpacity={0.75}
                        >
                          {stopping ? (
                            <ActivityIndicator size="small" color="#F43F5E" />
                          ) : (
                            <Square size={11} color="#F43F5E" />
                          )}
                          <Text style={styles.stopBtnText}>{stopping ? 'Stopping...' : 'Stop'}</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* NOT live AND NOT sold (includes Ready + Ended): Go Live + Mark SOLD OUT */}
                    {!isLive && !isSold && (
                      <>
                        <TouchableOpacity
                          style={styles.goLiveBtn}
                          onPress={() => handleGoLive(v.inspectionId)}
                          disabled={goLiveLoading !== null}
                          activeOpacity={0.75}
                        >
                          {goLiveLoading === v.inspectionId ? (
                            <ActivityIndicator size="small" color="#0D0E12" />
                          ) : (
                            <PlayCircle size={13} color="#0D0E12" />
                          )}
                          <Text style={styles.goLiveBtnText}>
                            {goLiveLoading === v.inspectionId ? 'Launching...' : 'Go Live'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.soldOutBtn}
                          onPress={() => handleMarkSoldOut(v.inspectionId, vehicleName)}
                          disabled={markSoldLoading !== null}
                          activeOpacity={0.75}
                        >
                          {markSoldLoading === v.inspectionId ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <CheckCircle2 size={13} color="#FFFFFF" />
                          )}
                          <Text style={styles.soldOutBtnText}>
                            {markSoldLoading === v.inspectionId ? 'Updating...' : 'Mark SOLD'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Stop Auction Confirm Modal */}
      <Modal visible={stopModal.visible} transparent animationType="fade" onRequestClose={() => setStopModal({ visible: false, auctionId: null, vehicleName: '' })}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalDangerIcon}>
                <AlertTriangle size={22} color="#F43F5E" />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Stop Live Auction</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Are you sure you want to stop the live auction for{' '}
              <Text style={{ fontWeight: '900', color: colors.foreground }}>{stopModal.vehicleName}</Text>?
            </Text>
            <Text style={[styles.modalWarn, { color: colors.mutedForeground }]}>
              This will immediately end the bidding session. Dealers will no longer be able to place bids.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setStopModal({ visible: false, auctionId: null, vehicleName: '' })}
                disabled={stopping}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalStopBtn}
                onPress={handleStopAuction}
                disabled={stopping}
                activeOpacity={0.8}
              >
                {stopping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Square size={12} color="#FFFFFF" />
                )}
                <Text style={styles.modalStopText}>{stopping ? 'Stopping...' : 'Stop Auction'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  liveBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFC700' },

  // Search
  searchContainer: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', padding: 0 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // List
  listContainer: { padding: 14, gap: 16, paddingBottom: 40 },

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metricCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 12 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  metricValue: { fontSize: 22, fontWeight: '900' },
  metricSub: { fontSize: 9, fontWeight: '600', marginTop: 1 },

  // Card
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  leftAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, zIndex: 10, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cardGlowTop: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, zIndex: 0 },
  cardGlowBottom: { position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: 75, zIndex: 0 },

  // Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingLeft: 20, paddingVertical: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  regPill: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 6, borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.2)', paddingHorizontal: 8, paddingVertical: 3,
  },
  regPillText: { fontSize: 10, fontWeight: '900', color: '#FFC700', letterSpacing: 0.5 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },

  // Card Body
  cardBody: { paddingHorizontal: 16, paddingLeft: 20, paddingTop: 8, paddingBottom: 0 },
  vehicleName: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  vehicleVariant: { fontSize: 10.5, fontWeight: '600', marginTop: 1, marginBottom: 8 },

  // Spec Panel
  specPanel: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  specRow: { flexDirection: 'row', alignItems: 'center' },
  specCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7 },
  specIcon: { width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,199,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  specLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  specVal: { fontSize: 11, fontWeight: '800' },
  specDivider: { width: 1, alignSelf: 'stretch' },
  specHDivider: { height: 1 },

  // Card Footer
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingLeft: 20, paddingVertical: 8, borderTopWidth: 1 },
  detailsBtn: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 'auto',
  },
  detailsBtnText: { fontSize: 11, fontWeight: '900' },
  copyLinkBtn: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  copyLinkText: { color: '#3B82F6', fontSize: 11, fontWeight: '900' },
  goLiveBtn: {
    backgroundColor: '#FFC700', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  goLiveBtnText: { color: '#0D0E12', fontSize: 11, fontWeight: '900' },
  soldOutBtn: {
    backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  soldOutBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  monitorBtn: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderColor: 'rgba(255,199,0,0.25)', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  monitorBtnText: { color: '#FFC700', fontSize: 11, fontWeight: '900' },
  stopBtn: {
    backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.25)', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  stopBtnText: { color: '#F43F5E', fontSize: 11, fontWeight: '900' },
  concludedLabel: { fontSize: 11, fontWeight: '700', fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  modalContent: { borderWidth: 1, borderRadius: 22, padding: 22 },
  modalIconRow: { alignItems: 'center', marginBottom: 14 },
  modalDangerIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244,63,94,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  modalSub: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  modalWarn: { fontSize: 10.5, fontWeight: '600', textAlign: 'center', marginTop: 10, marginBottom: 18, lineHeight: 16 },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  modalCancelBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  modalCancelText: { fontSize: 12, fontWeight: '800' },
  modalStopBtn: {
    backgroundColor: '#F43F5E', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  modalStopText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
