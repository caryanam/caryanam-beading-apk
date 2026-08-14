import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  RefreshCw,
  Gavel,
  Tag,
  Clock,
  Crown,
  PlayCircle,
  Square,
  Zap,
  Car,
  TrendingUp,
  ShieldCheck,
  Copy,
  Send,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
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

// Ported from web: src/lib/utils.ts — formats bid timestamps like the web detail page
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
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let relative = '';
  if (diffMin <= 1)      relative = '1 min ago';
  else if (diffMin < 60) relative = `${diffMin} mins ago`;
  else if (diffHr < 24)  relative = `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  else if (diffDay < 7)  relative = `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  else relative = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${relative} (${exactTime.toLowerCase()})`;
}

function formatIndianDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return 'N/A';
  if (input instanceof Date) return isNaN(input.getTime()) ? 'N/A' : formatParsedDate(input);
  if (typeof input === 'number') { const d = new Date(input); return isNaN(d.getTime()) ? 'N/A' : formatParsedDate(d); }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{10,13}$/.test(trimmed)) { const d = new Date(Number(trimmed)); return isNaN(d.getTime()) ? trimmed : formatParsedDate(d); }
    const parsed = parseDateStringToLocal(trimmed);
    if (parsed && !isNaN(parsed.getTime())) return formatParsedDate(parsed);
    return trimmed;
  }
  return 'N/A';
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';

// ── Component ────────────────────────────────────────────

interface AdminAuctionDetailScreenProps {
  navigation: any;
  route: any;
  onOpenMenu: () => void;
}

export const AdminAuctionDetailScreen: React.FC<AdminAuctionDetailScreenProps> = ({ navigation, route, onOpenMenu: _onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const inspectionId: number = Number(route?.params?.inspectionId);

  const [inspection, setInspection] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [remaining, setRemaining] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [stoppingAuction, setStoppingAuction] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [markingSoldOut, setMarkingSoldOut] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);

  const [, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Data Fetching ──────────────────────────────────────

  const fetchDetail = async (showMsg = false) => {
    if (!inspectionId) return;
    if (showMsg) setRefreshing(true); else setLoading(true);
    try {
      const [insRes, bidsRes] = await Promise.all([
        adminService.getInspectionById(inspectionId),
        adminService.getAdminBidHistory(inspectionId),
      ]);
      if (insRes.success && insRes.data) setInspection(insRes.data);
      if (bidsRes.success && bidsRes.data) setBidHistory(bidsRes.data);
      if (showMsg) showToast({ message: 'Auction details refreshed', type: 'success' });
    } catch {
      if (showMsg) showToast({ message: 'Could not load auction details.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId]);

  const onRefresh = () => fetchDetail(true);

  // ── Live countdown ─────────────────────────────────────

  useEffect(() => {
    const endsAt = inspection?.vehicleDetails?.auctionEndTime || inspection?.vehicle?.auctionEndTime;
    if (!endsAt) return;
    const interval = setInterval(() => setRemaining(timeLeft(endsAt)), 1000);
    return () => clearInterval(interval);
  }, [inspection?.vehicleDetails?.auctionEndTime, inspection?.vehicle?.auctionEndTime]);

  // ── Actions ────────────────────────────────────────────

  const handleGoLive = async () => {
    if (!inspectionId) return;
    setLaunching(true);
    try {
      showToast({ message: 'Launching live auction room...', type: 'info' });
      const res = await adminService.startLiveAuction(inspectionId);
      if (res.success) {
        showToast({ message: 'Auction is now LIVE!', type: 'success' });
        fetchDetail();
      } else {
        showToast({ message: res.message || 'Failed to launch auction.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to start live auction.', type: 'error' });
    } finally {
      setLaunching(false);
    }
  };

  const handleConfirmStopAuction = async () => {
    if (!inspectionId) return;
    setStoppingAuction(true);
    try {
      showToast({ message: 'Stopping live auction...', type: 'info' });
      const res = await adminService.stopLiveAuction(inspectionId);
      if (res.success) {
        showToast({ message: 'Auction stopped successfully.', type: 'success' });
        fetchDetail();
      } else {
        showToast({ message: res.message || 'Failed to stop auction.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to stop auction.', type: 'error' });
    } finally {
      setStoppingAuction(false);
      setStopModalOpen(false);
    }
  };

  const copyPublicLink = () => {
    if (!inspectionId) return;
    const publicUrl = `https://caryanamlive.com/public-bid/${inspectionId}`;
    Clipboard.setString(publicUrl);
    showToast({ message: 'Public Bidding Room link copied to clipboard!', type: 'success' });
  };

  const handleSendMsgToDealer = async () => {
    if (!adminMsg.trim() || !inspectionId) {
      showToast({ message: 'Please enter a message for the winning dealer.', type: 'error' });
      return;
    }
    setSendingMsg(true);
    try {
      const res = await adminService.sendAdminDealerMessage(inspectionId, adminMsg);
      if (res.success) {
        showToast({ message: 'Message sent to winning dealer!', type: 'success' });
        setInspection((prev: any) => ({
          ...prev,
          vehicleDetails: {
            ...(prev?.vehicleDetails || prev?.vehicle || {}),
            adminDealerMessage: adminMsg,
          },
        }));
        setAdminMsg('');
      } else {
        showToast({ message: 'Failed to send message.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error sending message.', type: 'error' });
    } finally {
      setSendingMsg(false);
    }
  };

  const handleMarkSoldOut = async () => {
    if (!inspectionId) return;
    setMarkingSoldOut(true);
    try {
      const res = await adminService.updateInspectionVehicleStatus(inspectionId, 'SOLD OUT');
      if (res.success) {
        showToast({ message: 'Vehicle status updated to SOLD OUT!', type: 'success' });
        fetchDetail();
      } else {
        showToast({ message: 'Failed to update status.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error updating vehicle status.', type: 'error' });
    } finally {
      setMarkingSoldOut(false);
    }
  };

  // ── Derived ────────────────────────────────────────────

  const v = inspection?.vehicleDetails || inspection?.vehicle || {};
  const vehicleStatus = v.vehicleStatus || inspection?.status || 'APPROVED';
  const isLive = vehicleStatus === 'LIVE';
  const isSold = vehicleStatus === 'SOLD OUT' || vehicleStatus === 'SOLD';
  const isEnded =
    vehicleStatus === 'ENDED' ||
    vehicleStatus === 'AUCTION ENDED' ||
    vehicleStatus === 'AUCTION_ENDED' ||
    vehicleStatus === 'COMPLETED';

  const topBidder = v.currentHighestBidder
    ? v.currentHighestBidder.dealershipName ||
      v.currentHighestBidder.ownerName ||
      v.currentHighestBidder
    : bidHistory[0]?.dealer || 'No Bids';
  const topBid = v.currentHighestBid || bidHistory[0]?.amount || 0;
  const basePrice = v.suggestedPrice || 0;
  const totalBids = v.totalBids || bidHistory.length || 0;

  const photos = (inspection?.inspectionPhotos || [])
    .filter((img: any) => img.imageUrl)
    .map((img: any) => img.imageUrl);
  const primaryPhoto = photos[0] || FALLBACK_IMAGE;

  // Theme-aware colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const rowBg        = isDark ? 'rgba(255,255,255,0.04)' : '#F2F4FA';
  const rowBorder    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,110,140,0.15)';

  const statusChip = () => {
    if (isLive) return { label: 'Live Room', color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', pulse: true };
    if (isSold) return { label: 'Sold Out', color: '#F43F5E', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.35)', pulse: false };
    return { label: 'Scheduled', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', pulse: false };
  };
  const sc = statusChip();

  // ── Render ─────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Gavel size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Auction Details
          </Text>
        </View>
        <View style={styles.headerRightActions}>
          <AdminNotificationsModal />
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading Auction Bidding Data...</Text>
        </View>
      ) : !inspection ? (
        <View style={styles.notFoundContainer}>
          <AlertTriangle size={32} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Auction Record Not Found</Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={14} color="#0D0E12" />
            <Text style={styles.returnBtnText}>Return to Auctions List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header Bar */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <View style={styles.heroRow}>
              <View style={styles.heroText}>
                <View style={styles.heroBadges}>
                  <View style={styles.regPill}>
                    <Text style={styles.regPillText}>{v.vehicleNumber || 'UNREGISTERED'}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    {sc.pulse && <View style={[styles.statusDot, { backgroundColor: sc.color }]} />}
                    <Text style={[styles.statusText, { color: sc.color }]}>{sc.label.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  {v.brand} {v.model} {v.variant}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              {isLive && (
                <TouchableOpacity style={styles.linkBtn} onPress={copyPublicLink} activeOpacity={0.8}>
                  <Copy size={13} color="#FFC700" />
                  <Text style={styles.linkBtnText}>Copy Public Link</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8} disabled={refreshing}>
                <RefreshCw size={13} color="#FFC700" />
                <Text style={[styles.refreshBtnText, { color: colors.foreground }]}>Refresh</Text>
              </TouchableOpacity>
              {isLive && (
                <>
                  <TouchableOpacity
                    style={styles.monitorBtn}
                    onPress={() => navigation.navigate('AdminLiveBidding')}
                    activeOpacity={0.8}
                  >
                    <Radio size={13} color="#FFC700" />
                    <Text style={styles.monitorBtnText}>Monitor Live Room</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopBtn}
                    onPress={() => setStopModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Square size={12} color="#F43F5E" />
                    <Text style={styles.stopBtnText}>Stop Auction</Text>
                  </TouchableOpacity>
                </>
              )}
              {!isLive && !isSold && (
                <TouchableOpacity style={styles.goLiveBtn} onPress={handleGoLive} activeOpacity={0.8} disabled={launching}>
                  {launching ? (
                    <ActivityIndicator size="small" color="#0D0E12" />
                  ) : (
                    <PlayCircle size={14} color="#0D0E12" />
                  )}
                  <Text style={styles.goLiveBtnText}>{launching ? 'Launching...' : 'Launch Live Auction'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Auction Ended - Seller & Dealer Negotiation Center */}
          {(isEnded || isSold) && (
            <View style={[styles.negContainer, { borderColor: 'rgba(245,158,11,0.35)', backgroundColor: cardBg }]}>
              <View>
                <Text style={[styles.negTitle, { color: colors.foreground }]}>
                  Auction Ended - Seller & Dealer Negotiation Center
                </Text>
                <Text style={[styles.negSub, { color: colors.mutedForeground }]}>
                  Review seller agreement, communicate with winning dealer, and manually update status to SOLD OUT
                </Text>
              </View>

              <View style={[styles.negInner, { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.05)' }]}>
                <View style={styles.negHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.negPill}>
                      <Text style={styles.negPillText}>AUCTION ENDED · SELLER & DEALER NEGOTIATION</Text>
                    </View>
                    <Text style={[styles.negVehicle, { color: colors.foreground }]}>
                      {v.brand} {v.model} {v.variant}
                    </Text>
                    <Text style={[styles.negMeta, { color: colors.mutedForeground }]}>
                      {v.vehicleNumber} · Winner: <Text style={[styles.negWinner, { color: colors.foreground }]}>{topBidder}</Text> ({inr(topBid)})
                    </Text>
                  </View>
                  {!isSold && (
                    <TouchableOpacity
                      style={styles.soldOutBtn}
                      onPress={handleMarkSoldOut}
                      activeOpacity={0.8}
                      disabled={markingSoldOut}
                    >
                      {markingSoldOut ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <CheckCircle2 size={13} color="#FFFFFF" />
                      )}
                      <Text style={styles.soldOutBtnText}>
                        {markingSoldOut ? 'Updating...' : 'Mark SOLD OUT'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Seller Response Box */}
                <View style={styles.sellerBox}>
                  <View style={styles.sellerBoxHeader}>
                    <Text style={styles.sellerBoxHeaderText}>Seller Confirmation Response:</Text>
                    <Text style={styles.sellerBoxHeaderText}>
                      {v.sellerAgreed !== undefined && v.sellerAgreed !== null ? 'Response Received' : 'Awaiting Seller Response'}
                    </Text>
                  </View>
                  {v.sellerAgreed !== undefined && v.sellerAgreed !== null ? (
                    <Text style={styles.sellerBoxBody}>
                      Question: "Are you agree for this price for sell?" ➔{' '}
                      <Text style={styles.sellerBoxStrong}>
                        {v.sellerAgreed
                          ? 'YES (Agreed to sell)'
                          : `NO (Wants ${v.sellerCounterPrice ? inr(v.sellerCounterPrice) : 'Higher Price'})`}
                      </Text>
                      {v.sellerMessage && (
                        <Text style={styles.sellerBoxNote}>
                          {'\n'}Note to Admin: "{v.sellerMessage}"
                        </Text>
                      )}
                    </Text>
                  ) : (
                    <Text style={styles.sellerBoxBody}>
                      Awaiting seller response from public link or vehicle detail page.
                    </Text>
                  )}
                </View>

                {/* Send Message to Winning Dealer */}
                <View style={{ gap: 6 }}>
                  <Text style={[styles.dealerMsgLabel, { color: colors.foreground }]}>
                    Send Message to Winning Dealer ({topBidder}):
                  </Text>
                  <View style={styles.dealerMsgRow}>
                    <TextInput
                      style={[styles.dealerMsgInput, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border, color: colors.foreground }]}
                      placeholder="e.g. Seller agreed to sell at ₹4.25L. Please confirm..."
                      placeholderTextColor={colors.mutedForeground}
                      value={adminMsg}
                      onChangeText={setAdminMsg}
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, { opacity: sendingMsg || !adminMsg.trim() ? 0.5 : 1 }]}
                      onPress={handleSendMsgToDealer}
                      activeOpacity={0.8}
                      disabled={sendingMsg || !adminMsg.trim()}
                    >
                      {sendingMsg ? (
                        <ActivityIndicator size="small" color="#0D0E12" />
                      ) : (
                        <Send size={12} color="#0D0E12" />
                      )}
                      <Text style={styles.sendBtnText}>{sendingMsg ? 'Sending...' : 'Send'}</Text>
                    </TouchableOpacity>
                  </View>
                  {v.adminDealerMessage && (
                    <Text style={styles.lastMsgText}>
                      Last Message Sent to Dealer: "{v.adminDealerMessage}"
                    </Text>
                  )}
                </View>

                {/* Dealer Reply Box */}
                {v.dealerReplyMessage && (
                  <View style={styles.dealerReplyBox}>
                    <Text style={styles.dealerReplyTitle}>Winning Dealer Reply Received:</Text>
                    <Text style={styles.dealerReplyBody}>"{v.dealerReplyMessage}"</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 4 Summary Stat Cards */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: 'rgba(255,199,0,0.07)', borderColor: 'rgba(255,199,0,0.35)' }]}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabelGold}>{isSold ? 'Auction Winner' : 'Highest Active Bidder'}</Text>
                <Crown size={16} color="#FFC700" />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>{topBidder}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>
                {isSold ? 'Confirmed Winner' : 'Bidding Leader'}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Highest Bid</Text>
                <Gavel size={16} color="#10B981" />
              </View>
              <Text style={styles.metricValueGreen}>{topBid > 0 ? inr(topBid) : 'No Bids Yet'}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Current Best Offer</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Base Price</Text>
                <Tag size={16} color="#FFC700" />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{basePrice > 0 ? inr(basePrice) : 'N/A'}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Suggested Price</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Total Bids</Text>
                <Zap size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{totalBids}</Text>
              <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Total Bids Placed</Text>
            </View>
          </View>

          {/* Auction Bidding History Feed */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                <TrendingUp size={16} color="#FFC700" /> Auction Bidding History ({bidHistory.length})
              </Text>
              {isLive && (
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>Real-Time Live</Text>
                </View>
              )}
            </View>

            {bidHistory.length === 0 ? (
              <View style={[styles.bidsEmpty, { borderColor: colors.border }]}>
                <Text style={[styles.bidsEmptyText, { color: colors.mutedForeground }]}>
                  No bids have been placed for this vehicle yet.
                </Text>
              </View>
            ) : (
              bidHistory.map((bid: any, idx: number) => {
                const isTop = idx === 0;
                const bAmount = bid.amount || bid.bidAmount || 0;
                const nextLowerBid = bidHistory[idx + 1];
                const lowerAmount = nextLowerBid
                  ? nextLowerBid.amount || nextLowerBid.bidAmount || 0
                  : v.suggestedPrice || 0;
                const diff = bAmount > lowerAmount ? bAmount - lowerAmount : 0;
                const bDealer = bid.dealer || bid.dealerName || bid.dealershipName || 'Registered Dealer';
                const bTime = formatIndianDateTime(bid.createdAt || bid.time || bid.bidTime);

                return (
                  <View
                    key={idx}
                    style={[
                      styles.bidRow,
                      {
                        backgroundColor: isTop ? 'rgba(255,199,0,0.12)' : (isDark ? 'rgba(255,255,255,0.04)' : '#F6F7FB'),
                        borderColor: isTop ? 'rgba(255,199,0,0.45)' : rowBorder,
                      },
                    ]}
                  >
                    <View style={styles.bidLeft}>
                      <View style={[styles.bidRank, { backgroundColor: isTop ? '#FFC700' : (isDark ? '#1A1D28' : '#E7EAF3'), borderColor: rowBorder }]}>
                        <Text style={[styles.bidRankText, { color: isTop ? '#0D0E12' : colors.mutedForeground }]}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.bidDealerRow}>
                          <Text style={[styles.bidDealer, { color: colors.foreground }]} numberOfLines={1}>{bDealer}</Text>
                          {isTop && (
                            <View style={styles.leaderPill}>
                              <Text style={styles.leaderPillText}>Leader / Highest Offer</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.bidTime, { color: colors.mutedForeground }]}>{bTime}</Text>
                      </View>
                    </View>
                    <View style={styles.bidRight}>
                      <Text style={[styles.bidAmount, { color: isTop ? '#FFC700' : colors.foreground }]}>{inr(bAmount)}</Text>
                      {diff > 0 && (
                        <Text style={styles.bidDiff}>
                          <TrendingUp size={11} color="#10B981" /> +{inr(diff)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Auction Control Room Card */}
          <View style={[styles.controlCard, { borderColor: 'rgba(255,199,0,0.4)' }]}>
            <View style={[styles.controlHeader, { borderBottomColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={styles.controlTitle}>AUCTION CONTROL ROOM</Text>
              <View style={[styles.controlStatusChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                <Text style={[styles.controlStatusText, { color: sc.color }]}>{vehicleStatus}</Text>
              </View>
            </View>

            <View style={styles.controlRows}>
              <View style={styles.controlRow}>
                <Text style={styles.controlRowLabel}>Room Status:</Text>
                <Text style={styles.controlRowValue}>{vehicleStatus}</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlRowLabel}>Reserve Base:</Text>
                <Text style={styles.controlRowValueGold}>{inr(basePrice)}</Text>
              </View>
              <View style={styles.controlRow}>
                <Text style={styles.controlRowLabel}>Leading Bid:</Text>
                <Text style={styles.controlRowValueGreen}>{topBid > 0 ? inr(topBid) : 'No bids'}</Text>
              </View>
            </View>

            {isLive ? (
              <View style={styles.controlInner}>
                {remaining && (
                  <View style={styles.countdownRow}>
                    <Text style={styles.countdownLabel}>
                      <Clock size={13} color="#FFC700" /> Live Countdown
                    </Text>
                    <Text style={styles.countdownValue}>{remaining}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.stopLiveBtn}
                  onPress={() => setStopModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Square size={13} color="#FFFFFF" />
                  <Text style={styles.stopLiveBtnText}>Stop Live Auction</Text>
                </TouchableOpacity>
              </View>
            ) : isSold ? (
              <View style={[styles.controlInner, styles.controlEndedBox]}>
                <Text style={styles.controlEndedText}>Auction Ended / Sold Out</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.launchRoomBtn} onPress={handleGoLive} activeOpacity={0.8} disabled={launching}>
                {launching ? (
                  <ActivityIndicator size="small" color="#0D0E12" />
                ) : (
                  <PlayCircle size={14} color="#0D0E12" />
                )}
                <Text style={styles.launchRoomBtnText}>
                  {launching ? 'Launching...' : 'Launch Live Auction Room'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Seller Price Decision Response Card */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: 'rgba(245,158,11,0.4)' }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ShieldCheck size={18} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seller Price Decision Response</Text>
            </View>
            {v.sellerAgreed !== undefined && v.sellerAgreed !== null ? (
              <View style={{ gap: 10 }}>
                <View style={styles.decisionRow}>
                  <Text style={[styles.decisionLabel, { color: colors.mutedForeground }]}>Seller Decision:</Text>
                  <View style={[styles.decisionChip, {
                    backgroundColor: v.sellerAgreed ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                    borderColor: v.sellerAgreed ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)',
                  }]}>
                    <Text style={[styles.decisionChipText, { color: v.sellerAgreed ? '#10B981' : '#F43F5E' }]}>
                      {v.sellerAgreed ? 'YES (Agreed to Top Bid)' : 'NO (Wants Higher Price)'}
                    </Text>
                  </View>
                </View>
                {!v.sellerAgreed && v.sellerCounterPrice && (
                  <View style={styles.decisionRow}>
                    <Text style={[styles.decisionLabel, { color: colors.mutedForeground }]}>Expected Counter Price:</Text>
                    <Text style={[styles.decisionValue, { color: colors.foreground }]}>{inr(v.sellerCounterPrice)}</Text>
                  </View>
                )}
                {v.sellerMessage && (
                  <View style={[styles.noteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F4F5F9', borderColor: rowBorder }]}>
                    <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>OPTIONAL NOTE TO ADMIN</Text>
                    <Text style={[styles.noteBody, { color: colors.foreground }]}>"{v.sellerMessage}"</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.decisionEmpty, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F6F7FB' }]}>
                <Clock size={16} color="#F59E0B" />
                <Text style={[styles.decisionEmptyText, { color: colors.mutedForeground }]}>
                  No seller decision response submitted yet.
                </Text>
              </View>
            )}
          </View>

          {/* Primary Vehicle Image Card */}
          <View style={[styles.imageCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <Image
              source={{ uri: primaryPhoto }}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
            <View style={styles.imageCaption}>
              <Text style={styles.imageCaptionTitle}>{v.brand} {v.model} {v.variant}</Text>
              <Text style={styles.imageCaptionSub}>{v.manufacturingYear || 2021} Model</Text>
            </View>
          </View>

          {/* Basic Vehicle Details Panel */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              <Car size={16} color="#FFC700" /> Vehicle Basic Details
            </Text>

            <View style={styles.detailRows}>
              {[
                { label: 'Vehicle Number', value: v.vehicleNumber || 'N/A', gold: false },
                { label: 'Make & Model', value: `${v.brand} ${v.model}`, gold: false },
                { label: 'Variant', value: v.variant || 'Standard', gold: false },
                { label: 'Manufacturing Year', value: String(v.manufacturingYear || '2021'), gold: false },
                { label: 'Fuel Type', value: v.fuelType || 'Petrol', gold: false },
                { label: 'Transmission', value: v.transmission || 'Manual', gold: false },
                { label: 'Odometer Reading', value: v.odometerReading ? `${v.odometerReading}` : 'N/A', gold: false },
                { label: 'Owner Profile', value: v.ownerName || '1st Owner', gold: false },
              ].map((row, idx) => (
                <View key={idx} style={[styles.detailRow, { backgroundColor: rowBg, borderColor: rowBorder }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{row.value}</Text>
                </View>
              ))}
              <View style={[styles.detailRow, { backgroundColor: 'rgba(255,199,0,0.1)', borderColor: 'rgba(255,199,0,0.3)' }]}>
                <Text style={styles.baseLabel}>Base Price</Text>
                <Text style={styles.baseValue}>{inr(basePrice)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Stop Auction Confirm Modal */}
      <Modal visible={stopModalOpen} transparent animationType="fade" onRequestClose={() => setStopModalOpen(false)}>
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
              <Text style={{ fontWeight: '900', color: colors.foreground }}>{v.brand} {v.model}</Text>?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setStopModalOpen(false)}
                disabled={stoppingAuction}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalStopBtn}
                onPress={handleConfirmStopAuction}
                disabled={stoppingAuction}
                activeOpacity={0.8}
              >
                {stoppingAuction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Square size={12} color="#FFFFFF" />
                )}
                <Text style={styles.modalStopText}>
                  {stoppingAuction ? 'Stopping...' : 'Stop Auction'}
                </Text>
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3, flexShrink: 1 },

  // Loading / Not Found
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  notFoundTitle: { fontSize: 16, fontWeight: '900' },
  returnBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  returnBtnText: { color: '#0D0E12', fontSize: 12, fontWeight: '900' },

  // List
  listContainer: { padding: 14, gap: 14, paddingBottom: 40 },

  // Hero
  heroCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroText: { flex: 1 },
  heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regPill: { backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,199,0,0.25)', paddingHorizontal: 10, paddingVertical: 4 },
  regPillText: { fontSize: 10, fontWeight: '900', color: '#FFC700', letterSpacing: 0.5 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  heroTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, textTransform: 'uppercase', marginTop: 8 },

  // Action row
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,199,0,0.1)', borderColor: 'rgba(255,199,0,0.35)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  linkBtnText: { color: '#FFC700', fontSize: 10.5, fontWeight: '900' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  refreshBtnText: { fontSize: 10.5, fontWeight: '800' },
  monitorBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,199,0,0.13)', borderColor: 'rgba(255,199,0,0.35)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  monitorBtnText: { color: '#FFC700', fontSize: 10.5, fontWeight: '900' },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(244,63,94,0.13)', borderColor: 'rgba(244,63,94,0.35)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  stopBtnText: { color: '#F43F5E', fontSize: 10.5, fontWeight: '900' },
  goLiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFC700', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  goLiveBtnText: { color: '#0D0E12', fontSize: 11, fontWeight: '900' },

  // Negotiation center
  negContainer: { borderRadius: 18, borderWidth: 1, padding: 16 },
  negTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  negSub: { fontSize: 11, fontWeight: '600', marginTop: 4, lineHeight: 16 },
  negInner: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12, gap: 12 },
  negHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  negPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  negPillText: { fontSize: 8, fontWeight: '900', color: '#F59E0B', letterSpacing: 0.5 },
  negVehicle: { fontSize: 14, fontWeight: '900', marginTop: 6 },
  negMeta: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  negWinner: { fontWeight: '900' },
  soldOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  soldOutBtnText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
  sellerBox: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  sellerBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellerBoxHeaderText: { fontSize: 10.5, fontWeight: '900', color: '#F59E0B' },
  sellerBoxBody: { fontSize: 11, fontWeight: '600', lineHeight: 16, color: '#A16207' },
  sellerBoxStrong: { fontWeight: '900', color: '#B45309' },
  sellerBoxNote: { fontStyle: 'italic', opacity: 0.9, marginTop: 2 },
  dealerMsgLabel: { fontSize: 11.5, fontWeight: '900' },
  dealerMsgRow: { flexDirection: 'row', gap: 8 },
  dealerMsgInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 11.5, fontWeight: '600' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 },
  sendBtnText: { color: '#0D0E12', fontSize: 11, fontWeight: '900' },
  lastMsgText: { fontSize: 10.5, fontWeight: '600', color: '#3B82F6', opacity: 0.9 },
  dealerReplyBox: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1, borderRadius: 12, padding: 12 },
  dealerReplyTitle: { fontSize: 10.5, fontWeight: '900', color: '#3B82F6', marginBottom: 4 },
  dealerReplyBody: { fontSize: 11, fontWeight: '600', color: '#1E3A8A' },

  // Metric cards
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '47.5%', borderRadius: 14, borderWidth: 1, padding: 12 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  metricLabelGold: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', color: '#FFC700' },
  metricValue: { fontSize: 17, fontWeight: '900' },
  metricValueGreen: { fontSize: 17, fontWeight: '900', color: '#10B981' },
  metricSub: { fontSize: 9, fontWeight: '600', marginTop: 2 },

  // Section card
  sectionCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3, flexShrink: 1 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)', borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' },
  livePillText: { fontSize: 8.5, fontWeight: '800', color: '#10B981' },

  // Bids
  bidsEmpty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 28, alignItems: 'center' },
  bidsEmptyText: { fontSize: 11, fontWeight: '600' },
  bidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  bidLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bidRank: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  bidRankText: { fontSize: 10, fontWeight: '900' },
  bidDealerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bidDealer: { fontSize: 12.5, fontWeight: '800' },
  leaderPill: { backgroundColor: '#FFC700', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  leaderPillText: { color: '#0D0E12', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
  bidTime: { fontSize: 9.5, fontWeight: '600', marginTop: 3 },
  bidRight: { alignItems: 'flex-end', marginLeft: 10 },
  bidAmount: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  bidDiff: { flexDirection: 'row', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: '700', color: '#10B981', marginTop: 3 },

  // Control room
  controlCard: { borderRadius: 18, borderWidth: 1, backgroundColor: '#10121A', padding: 16 },
  controlHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12 },
  controlTitle: { fontSize: 11, fontWeight: '900', color: '#FFC700', letterSpacing: 0.8 },
  controlStatusChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  controlStatusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  controlRows: { gap: 9 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlRowLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  controlRowValue: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' },
  controlRowValueGold: { fontSize: 11, fontWeight: '900', color: '#FFC700' },
  controlRowValueGreen: { fontSize: 11, fontWeight: '900', color: '#10B981' },
  controlInner: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, gap: 10 },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countdownLabel: { fontSize: 11, fontWeight: '700', color: '#FFC700' },
  countdownValue: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  stopLiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F43F5E', borderRadius: 12, paddingVertical: 11 },
  stopLiveBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  controlEndedBox: { alignItems: 'center' },
  controlEndedText: { fontSize: 11, fontWeight: '900', color: '#FB7185' },
  launchRoomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFC700', borderRadius: 12, paddingVertical: 12, marginTop: 12 },
  launchRoomBtnText: { color: '#0D0E12', fontSize: 11, fontWeight: '900' },

  // Seller decision
  decisionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  decisionLabel: { fontSize: 11, fontWeight: '700' },
  decisionChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  decisionChipText: { fontSize: 10, fontWeight: '900' },
  decisionValue: { fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  noteBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  noteLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  noteBody: { fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  decisionEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  decisionEmptyText: { fontSize: 11, fontWeight: '600', flex: 1 },

  // Vehicle image
  imageCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  vehicleImage: { width: '100%', height: 200 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  imageCaption: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  imageCaptionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.2 },
  imageCaptionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Detail rows
  detailRows: { gap: 7 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  detailLabel: { fontSize: 10.5, fontWeight: '600' },
  detailValue: { fontSize: 11, fontWeight: '800' },
  baseLabel: { fontSize: 10.5, fontWeight: '900', color: '#FFC700' },
  baseValue: { fontSize: 13, fontWeight: '900', color: '#FFC700', fontVariant: ['tabular-nums'] },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  modalContent: { borderWidth: 1, borderRadius: 22, padding: 22 },
  modalIconRow: { alignItems: 'center', marginBottom: 14 },
  modalDangerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244,63,94,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  modalSub: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18 },
  modalCancelBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  modalCancelText: { fontSize: 12, fontWeight: '800' },
  modalStopBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F43F5E', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  modalStopText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
