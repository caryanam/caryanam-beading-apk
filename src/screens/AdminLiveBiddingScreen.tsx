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
  X,
  AlertTriangle,
  Radio,
  Activity,
  Copy,
  Send,
  TrendingUp,
  Search,
  History,
  Award,
  ArrowUpRight,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

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

// Matches the web's formatIndianDateTime: parses server timestamps robustly
// and shows relative time + exact clock time (e.g. "5 mins ago (5:20:15 pm)").
const formatIndianDateTime = (input?: string | number | Date | null): string => {
  if (!input) return 'N/A';
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? 'N/A' : formatParsedDate(input);
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? 'N/A' : formatParsedDate(d);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return 'N/A';
    const parsedDate = parseDateStringToLocal(trimmed);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return formatParsedDate(parsedDate);
    }
    return trimmed;
  }
  return 'N/A';
};

const parseDateStringToLocal = (inputStr: string): Date | null => {
  const trimmed = inputStr.trim();
  if (!trimmed) return null;

  // ISO format without explicit Z or offset: e.g. "2026-08-11T17:20:15.166002" or "2026-08-11 17:20:15"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = parseInt(isoMatch[4], 10);
    const minutes = parseInt(isoMatch[5], 10);
    const seconds = parseInt(isoMatch[6], 10);
    const msStr = (isoMatch[7] || '0').slice(0, 3).padEnd(3, '0');
    const ms = parseInt(msStr, 10);
    return new Date(year, month, day, hours, minutes, seconds, ms);
  }

  // If string contains explicit timezone indicator Z or + / - offset
  if (trimmed.includes('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatParsedDate = (date: Date): string => {
  const exactTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0 || diffMs < 10000) {
    return `1 min ago (${exactTime.toLowerCase()})`;
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let relative = '';
  if (diffMin <= 1) {
    relative = '1 min ago';
  } else if (diffMin < 60) {
    relative = `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHr < 24) {
    relative = `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    relative = `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    relative = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return `${relative} (${exactTime.toLowerCase()})`;
};

interface LiveBidRecord {
  dealer: string;
  amount: number;
  time: string;
}

// ── Component ────────────────────────────────────────────

interface AdminLiveBiddingScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const AdminLiveBiddingScreen: React.FC<AdminLiveBiddingScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'inspector' | 'freelancer'>('all');

  // Real-time tracking states for selected room
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('No bids placed');
  const [totalBids, setTotalBids] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(Date.now() + 600 * 1000);
  const [status, setStatus] = useState<string>('LIVE');
  const [bidHistory, setBidHistory] = useState<LiveBidRecord[]>([]);

  const [adminDealerMsgText, setAdminDealerMsgText] = useState('');
  const [sellerResp, setSellerResp] = useState<any>(null);
  const [dealerReply, setDealerReply] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time tick for live countdowns
  const [, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const selectedRoom = inspections.find((r) => r.inspectionId === selectedId);

  const remaining = timeLeft(endTime);
  const isTimeLow = endTime - Date.now() > 0 && endTime - Date.now() <= 120000;

  // ── Data Fetching ──────────────────────────────────────

  const fetchRooms = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const [insRes, freeRes] = await Promise.all([
        adminService.getSubmittedInspections(),
        adminService.getFreelancerInspections()
      ]);

      let inspectorList = [];
      if (insRes.success && insRes.data) {
        inspectorList = insRes.data.map((ins: any) => ({
          ...ins,
          inspectionId: ins.inspectionId || ins.id,
          sourceType: 'INSPECTOR',
        }));
      }

      let freelancerList = [];
      if (freeRes.success && freeRes.data) {
        freelancerList = freeRes.data.map((item: any) => {
          const insId = item.inspectionId || item.id;
          return {
            ...item,
            inspectionId: insId,
            vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || `INS-${insId}`,
            brand: item.brand || '',
            model: item.model || '',
            variant: item.variant || '',
            ownerName: item.ownerName || '1st Owner',
            suggestedPrice: item.suggestedPrice || item.price || 0,
            submittedAt: item.submittedAt || item.createdAt || null,
            inspectorName: item.freelancerName || item.inspectorName || item.inspector?.fullName || (item.inspectorId ? `Freelancer #${item.inspectorId}` : 'Freelancer'),
            status: item.status || 'APPROVED',
            vehicleStatus: item.vehicleStatus || item.status || 'LIVE',
            sourceType: 'FREELANCER',
          };
        });
      }

      const combined = [...inspectorList, ...freelancerList];
      const liveOnly = combined.filter(
        (ins: any) => String(ins.vehicleStatus || ins.status || '').toUpperCase() === 'LIVE'
      );

      setInspections(liveOnly);
      if (
        liveOnly.length > 0 &&
        (selectedId === null || !liveOnly.some((i: any) => i.inspectionId === selectedId))
      ) {
        setSelectedId(liveOnly[0].inspectionId);
      }
      if (showMsg) showToast({ message: 'Active live bidding rooms refreshed', type: 'success' });
    } catch (err) {
      if (showMsg) showToast({ message: 'Failed to refresh live rooms', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onRefresh = () => fetchRooms(true);

  // Filtered rooms based on search query
  const filteredInspections = useMemo(() => {
    let list = inspections;
    if (activeTab === 'inspector') {
      list = list.filter((i: any) => i.sourceType === 'INSPECTOR');
    } else if (activeTab === 'freelancer') {
      list = list.filter((i: any) => i.sourceType === 'FREELANCER');
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (i) =>
        (i.brand || '').toLowerCase().includes(q) ||
        (i.model || '').toLowerCase().includes(q) ||
        (i.variant || '').toLowerCase().includes(q) ||
        (i.vehicleNumber || '').toLowerCase().includes(q),
    );
  }, [inspections, activeTab, searchQuery]);
  // Auto-select first room when activeTab changes
  useEffect(() => {
    if (filteredInspections.length > 0 && (!selectedId || !filteredInspections.some(i => i.inspectionId === selectedId))) {
      setSelectedId(filteredInspections[0].inspectionId);
    } else if (filteredInspections.length === 0) {
      setSelectedId(null);
    }
  }, [activeTab, filteredInspections]);

  // Initialize selected card details
useEffect(() => {
    if (!selectedRoom) return;
    setHighestBid(selectedRoom.currentHighestBid || selectedRoom.suggestedPrice || 0);
    setHighestBidder(selectedRoom.currentHighestBidder || 'No bids placed');
    setTotalBids(selectedRoom.totalBids || 0);
    setEndTime(selectedRoom.auctionEndTime || Date.now() + 600 * 1000);
    setStatus(selectedRoom.vehicleStatus || 'LIVE');
    if (selectedRoom.sellerAgreed !== undefined && selectedRoom.sellerAgreed !== null) {
      setSellerResp({ agreed: selectedRoom.sellerAgreed, counterPrice: selectedRoom.sellerCounterPrice, message: selectedRoom.sellerMessage });
    } else {
      setSellerResp(null);
    }
    if (selectedRoom.dealerReplyMessage) {
      setDealerReply({ reply: selectedRoom.dealerReplyMessage });
    } else {
      setDealerReply(null);
    }

    const fetchHistory = async () => {
      try {
        const res = await adminService.getAdminBidHistory(selectedRoom.inspectionId);
        if (res.success && res.data) {
          setBidHistory(res.data);
        }
      } catch (e) {
        console.error('Failed to load historical bids', e);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.inspectionId]);

  // Fallback real-time polling: keeps bid stream fresh without manual refresh
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const pollBidHistory = async () => {
      try {
        const res = await adminService.getAdminBidHistory(selectedId);
        if (cancelled || !res.success || !res.data) return;
        setBidHistory(res.data);
        if (res.data.length > 0) {
          setHighestBid(res.data[0].amount);
          setHighestBidder(res.data[0].dealer || 'No bids placed');
          setTotalBids(res.data.length);
        }
      } catch (e) {
        console.error('Failed to poll bid history', e);
      }
    };
    pollBidHistory();
    const interval = setInterval(pollBidHistory, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedId]);

  // Connect websocket for selected auction room (with auto-reconnect)
  useEffect(() => {
    if (!selectedId) return;

    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    if (wsReconnectRef.current) {
      clearTimeout(wsReconnectRef.current);
      wsReconnectRef.current = null;
    }

    const baseUrl = API_BASE_URL.replace(/\/+$/, '');
    const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    let host = 'localhost:8080';
    if (baseUrl.includes('://')) {
      host = baseUrl.split('://')[1];
    } else if (baseUrl) {
      host = baseUrl;
    }
    const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${selectedId}`;

    let socket: WebSocket | null = null;
    let manuallyClosed = false;

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (
          (data.type === 'BID_UPDATE' || data.type === 'GO_LIVE') &&
          Number(data.inspectionId) === Number(selectedId)
        ) {
          setHighestBid(data.currentHighestBid);
          setHighestBidder(data.currentHighestBidder || 'Anonymous');
          setTotalBids(data.totalBids);
          if (data.auctionEndTime) {
            setEndTime(data.auctionEndTime);
          }
          if (data.bidHistory) {
            setBidHistory(data.bidHistory);
          }
          setStatus('LIVE');
        } else if (
          data.type === 'AUCTION_ENDED' &&
          Number(data.inspectionId) === Number(selectedId)
        ) {
          setStatus('ENDED');
          setHighestBid(data.winningBid);
          setHighestBidder(data.winner || 'No winner');
          showToast({ message: `Auction ended: Winner is ${data.winner}`, type: 'info' });
        } else if (data.type === 'SELLER_RESPONSE' && Number(data.inspectionId) === Number(selectedId)) {
          setSellerResp({ agreed: data.sellerAgreed, counterPrice: data.sellerCounterPrice, message: data.sellerMessage });
          showToast({ message: 'Seller response received!', type: 'success' });
        } else if (data.type === 'DEALER_REPLY' && Number(data.inspectionId) === Number(selectedId)) {
          setDealerReply({ reply: data.dealerReplyMessage || data.reply });
          showToast({ message: 'Dealer reply received!', type: 'success' });
        } else if (data.type === 'VEHICLE_STATUS_UPDATE' && Number(data.inspectionId) === Number(selectedId)) {
          setStatus(data.vehicleStatus);
          showToast({ message: `Status updated to ${data.vehicleStatus}`, type: 'info' });
        }
      } catch (e) {
        console.error('Error parsing websocket message in Admin Monitor', e);
      }
    };

    const connect = () => {
      if (manuallyClosed) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        socket.onmessage = handleMessage;
        socket.onerror = () => {
          try { if (socket) socket.close(); } catch (e) {}
        };
        socket.onclose = () => {
          if (wsRef.current === socket) wsRef.current = null;
          if (!manuallyClosed) {
            wsReconnectRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        console.error('Failed to open websocket for auction room', e);
        if (!manuallyClosed) {
          wsReconnectRef.current = setTimeout(connect, 3000);
        }
      }
    };
    connect();

    return () => {
      manuallyClosed = true;
      if (wsReconnectRef.current) {
        clearTimeout(wsReconnectRef.current);
        wsReconnectRef.current = null;
      }
      if (socket) socket.close(1000);
      if (wsRef.current === socket) wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Actions ────────────────────────────────────────────

  const handleCopyLink = () => {
    if (!selectedRoom) return;
    const link = `https://caryanamlive.com/public-bid/${selectedRoom.inspectionId}`;
    Clipboard.setString(link);
    showToast({
      message: `Public Bidding Link copied for ${selectedRoom.brand} ${selectedRoom.model}!`,
      type: 'success',
    });
  };

  const handleSendDealerMsg = async () => {
    if (!selectedId || !adminDealerMsgText.trim()) {
      showToast({ message: 'Please enter a message for the dealer.', type: 'error' });
      return;
    }
    try {
      const res = await adminService.sendAdminDealerMessage(selectedId, adminDealerMsgText);
      if (res.success) {
        showToast({ message: 'Message sent to winning dealer!', type: 'success' });
        setAdminDealerMsgText('');
      } else {
        showToast({ message: 'Failed to send message.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Error sending message to dealer.', type: 'error' });
    }
  };

  const handleMarkAsSoldOutManual = async () => {
    if (!selectedId) return;
    try {
      const res = await adminService.updateInspectionVehicleStatus(selectedId, 'SOLD OUT');
      if (res.success) {
        setStatus('SOLD OUT');
        showToast({ message: `Vehicle #${selectedId} status manually updated to SOLD OUT!`, type: 'success' });
      } else {
        showToast({ message: 'Failed to update status.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to update status.', type: 'error' });
    }
  };

  // ── Status Helpers ─────────────────────────────────────

  const getStatusMeta = (s: string) => {
    if (s === 'LIVE') return { label: 'Live Room', color: '#10B981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', pulse: true };
    return { label: 'Sold Out', color: '#94A3B8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.3)', pulse: false };
  };

  const isConcluded = status === 'SOLD OUT' || status === 'ENDED' || status === 'AUCTION ENDED';

  // Theme-aware card colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const specBorder   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,110,140,0.15)';

  // ── Render ─────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Radio size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Live Bidding</Text>
          {inspections.length > 0 && (
            <View style={styles.liveBadge}>
              <Radio size={9} color="#FFC700" />
              <Text style={styles.liveBadgeText}>{inspections.length} Live</Text>
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading live bidding rooms...</Text>
        </View>
      ) : inspections.length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.emptyListContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.gavelIconWrap}>
              <Gavel size={32} color="#FFC700" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Active Bidding Sessions</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              There are currently no live vehicle auctions running in the system. Approve pending evaluation reports in the Auctions section to start live bidding.
            </Text>
            <TouchableOpacity
              style={styles.goAuctionsBtn}
              onPress={() => navigation.navigate('AdminAuctions')}
              activeOpacity={0.85}
            >
              <Text style={styles.goAuctionsBtnText}>Go to Auctions Dashboard</Text>
              <ArrowUpRight size={15} color="#0D0E12" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >

          {/* Telemetry Banner */}
          <View style={[styles.telemetryBanner, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={[styles.bannerGlow, { backgroundColor: isDark ? 'rgba(255,199,0,0.05)' : 'rgba(255,199,0,0.08)' }]} />
            <View style={styles.bannerRow}>
              <View style={styles.bannerTitleWrap}>
                <View style={styles.bannerTitleRow}>
                  <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Live Auction Telemetry</Text>
                  <View style={styles.activeRoomsPill}>
                    <Radio size={9} color="#FFC700" />
                    <Text style={styles.activeRoomsText}>
                      {inspections.length} Active {inspections.length === 1 ? 'Room' : 'Rooms'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>
                  Real-time WebSocket monitoring, active room stats & live dealer bidding logs
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageAuctionsBtn}
                onPress={() => navigation.navigate('AdminAuctions')}
                activeOpacity={0.85}
              >
                <Gavel size={13} color="#0D0E12" />
                <Text style={styles.manageAuctionsBtnText}>Manage Auctions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Rooms Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Live Rooms ({filteredInspections.length})
            </Text>
          </View>

          {/* Tab Filter */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity onPress={() => setActiveTab('all')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'all' ? '#FFC700' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'all' ? '#0D0E12' : colors.mutedForeground }}>All ({inspections.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('inspector')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'inspector' ? '#FFC700' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'inspector' ? '#0D0E12' : colors.mutedForeground }}>Inspector</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('freelancer')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'freelancer' ? '#FFC700' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'freelancer' ? '#0D0E12' : colors.mutedForeground }}>Freelancer</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
            <Search size={15} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search brand, model, or reg..."
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

          {/* Rooms List */}
          {filteredInspections.length === 0 ? (
            <View style={[styles.noMatchBox, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <Text style={[styles.noMatchText, { color: colors.mutedForeground }]}>
                No live room matches "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredInspections.map((v) => {
              const isActive = v.inspectionId === selectedId;
              return (
                <TouchableOpacity
                  key={v.inspectionId}
                  onPress={() => setSelectedId(v.inspectionId)}
                  activeOpacity={0.8}
                  style={[
                    styles.roomCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: isActive ? '#FFC700' : colors.border,
                    },
                    isActive && { shadowColor: '#FFC700', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
                  ]}
                >
                  {isActive && <View style={styles.roomAccentBar} />}

                  <View style={styles.roomTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.roomLiveChip, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.roomLiveText}>Live</Text>
                      </View>
                      <View style={[styles.roomLiveChip, { backgroundColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)', borderColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)' }]}>
                        <Text style={[styles.roomLiveText, { color: v.sourceType === 'FREELANCER' ? '#A855F7' : '#3B82F6' }]}>{v.sourceType === 'FREELANCER' ? 'Freelancer' : 'Inspector'}</Text>
                      </View>
                    </View>
                    <View style={styles.roomRegPill}>
                      <Text style={styles.roomRegText}>{v.vehicleNumber}</Text>
                    </View>
                  </View>

                  <Text style={[styles.roomName, { color: isActive ? '#FFC700' : colors.foreground }]} numberOfLines={1}>
                    {v.brand} {v.model}
                  </Text>
                  <Text style={[styles.roomVariant, { color: colors.mutedForeground }]} numberOfLines={1}>
                    Variant: {v.variant || 'Standard'}
                  </Text>

                  <View style={[styles.roomFooter, { borderTopColor: specBorder }]}>
                    <View>
                      <Text style={[styles.roomFooterLabel, { color: colors.mutedForeground }]}>CURRENT HIGHEST</Text>
                      <Text style={styles.roomFooterBid}>{inr(v.currentHighestBid || v.suggestedPrice || 0)}</Text>
                    </View>
                    <View style={[styles.roomTimer, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                      <Clock size={12} color="#FFC700" />
                      <Text style={[styles.roomTimerText, { color: colors.foreground }]}>
                        {timeLeft(v.auctionEndTime || Date.now() + 600 * 1000)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Telemetry Monitor for Selected Room */}
          {selectedRoom && (
            <View style={[styles.monitorCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <View style={[styles.monitorGlow, { backgroundColor: isDark ? 'rgba(255,199,0,0.05)' : 'rgba(255,199,0,0.08)' }]} />

              {/* Monitor Room Header */}
              <View style={[styles.monitorHeader, { borderBottomColor: specBorder }]}>
                <View style={styles.monitorHeaderTop}>
                  <View style={styles.monitorHeaderLeft}>
                    <View style={styles.monitorRegPill}>
                      <Text style={styles.monitorRegText}>{selectedRoom.vehicleNumber}</Text>
                    </View>
                    {(() => {
                      const meta = getStatusMeta(status);
                      return (
                        <View style={[styles.monitorStatusChip, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                          {meta.pulse && <View style={[styles.monitorStatusDot, { backgroundColor: meta.color }]} />}
                          <Text style={[styles.monitorStatusText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={[styles.monitorVehicleName, { color: colors.foreground }]} numberOfLines={1}>
                    {selectedRoom.brand} {selectedRoom.model}
                  </Text>
                  <Text style={[styles.monitorVariant, { color: colors.mutedForeground }]} numberOfLines={1}>
                    Variant: {selectedRoom.variant || 'Standard'} • Evaluated by {selectedRoom.inspectorName || 'Inspector'}
                  </Text>
                </View>

                {status === 'LIVE' && (
                  <View style={styles.monitorActionsRow}>
                    <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyLink} activeOpacity={0.8}>
                      <Copy size={13} color="#3B82F6" />
                      <Text style={styles.copyLinkText}>Copy Public Link</Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.countdownPill,
                        isTimeLow
                          ? { backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.5)' }
                          : { backgroundColor: 'rgba(255,199,0,0.1)', borderColor: 'rgba(255,199,0,0.3)' },
                      ]}
                    >
                      <View style={[styles.countdownIconWrap, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <Clock size={18} color={isTimeLow ? '#F43F5E' : '#FFC700'} />
                      </View>
                      <View>
                        <Text style={[styles.countdownLabel, { color: isTimeLow ? '#F43F5E' : '#FFC700' }]}>
                          TIME REMAINING
                        </Text>
                        <Text style={[styles.countdownValue, { color: isTimeLow ? '#F43F5E' : '#FFC700' }]}>
                          {remaining}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* 4 Metric Cards */}
              <View style={styles.metricsGrid}>
                {/* Valuation */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>VALUATION PRICE</Text>
                    <View style={styles.metricIcon}>
                      <Tag size={13} color={colors.mutedForeground} />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                    {selectedRoom.suggestedPrice ? inr(selectedRoom.suggestedPrice) : 'N/A'}
                  </Text>
                  <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Base Valuation</Text>
                </View>

                {/* Current Bid */}
                <View style={[styles.metricCard, styles.metricCardHighlight, { borderColor: 'rgba(255,199,0,0.4)' }]}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: '#FFC700' }]}>CURRENT BID</Text>
                    <View style={[styles.metricIcon, { backgroundColor: 'rgba(255,199,0,0.2)' }]}>
                      <Flame size={13} color="#FFC700" />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: '#FFC700' }]} numberOfLines={1}>
                    {inr(highestBid)}
                  </Text>
                  <Text style={[styles.metricSub, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
                    Highest Leader Amount
                  </Text>
                </View>

                {/* Leading Bidder */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>LEADING BIDDER</Text>
                    <View style={[styles.metricIcon, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                      <Award size={13} color="#10B981" />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                    {highestBidder}
                  </Text>
                  <Text style={[styles.metricSub, { color: '#10B981' }]}>✓ Top Rank Leader</Text>
                </View>

                {/* Total Bids */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>TOTAL BIDS</Text>
                    <View style={styles.metricIcon}>
                      <Activity size={13} color={colors.mutedForeground} />
                    </View>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                    {totalBids} Placed
                  </Text>
                  <Text style={[styles.metricSub, { color: colors.mutedForeground }]}>Live Telemetry Stream</Text>
                </View>
              </View>

              {/* Bidding Outcome Banner & Post-Auction Control Panel */}
              {isConcluded && (
                <View style={styles.postAuctionWrap}>
                  <View
                    style={[
                      styles.outcomeBanner,
                      totalBids === 0
                        ? { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }
                        : { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
                    ]}
                  >
                    <View style={styles.outcomeRow}>
                      <View
                        style={[
                          styles.outcomeIcon,
                          { backgroundColor: totalBids === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' },
                        ]}
                      >
                        {totalBids === 0 ? (
                          <AlertTriangle size={20} color="#F59E0B" />
                        ) : (
                          <CheckCircle2 size={20} color="#10B981" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.outcomeTitle,
                            { color: totalBids === 0 ? '#F59E0B' : '#10B981' },
                          ]}
                        >
                          {totalBids === 0
                            ? 'Bidding Concluded - Unsold'
                            : `Bidding Concluded - Status: ${status}`}
                        </Text>
                        <Text style={[styles.outcomeSub, { color: colors.mutedForeground }]}>
                          {totalBids === 0
                            ? 'The bidding timer expired without receiving any bids from dealers.'
                            : `Top winning dealer: '${highestBidder}' with highest bid of ${inr(highestBid)}.`}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.soldOutBtn} onPress={handleMarkAsSoldOutManual} activeOpacity={0.8}>
                      <CheckCircle2 size={12} color="#FFFFFF" />
                      <Text style={styles.soldOutBtnText}>Mark Status as SOLD OUT</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Seller Response Box */}
                  <View style={styles.sellerRespBox}>
                    <View style={styles.sellerRespHeader}>
                      <Text style={styles.sellerRespTitle}>Seller Price Confirmation Response:</Text>
                      <Text style={styles.sellerRespStatus}>
                        {sellerResp ? 'Response Submitted' : 'Pending Seller Response'}
                      </Text>
                    </View>
                    {sellerResp ? (
                      <Text style={[styles.sellerRespBody, { color: colors.mutedForeground }]}>
                        Question: "Are you agree for this price for sell?"{' ➔ '}
                        <Text style={sellerResp.agreed ? styles.sellerAgreed : styles.sellerNotAgreed}>
                          {sellerResp.agreed
                            ? 'YES (Agreed to sell)'
                            : `NO (Wants counter ₹${(sellerResp.counterPrice || 0).toLocaleString('en-IN')})`}
                        </Text>
                        {sellerResp.message ? (
                          <Text style={styles.sellerRespMsg}>
                            {'\n'}Message: "{sellerResp.message}"
                          </Text>
                        ) : null}
                      </Text>
                    ) : (
                      <Text style={[styles.sellerRespBody, { color: colors.mutedForeground }]}>
                        Awaiting seller response from public link or vehicle detail page.
                      </Text>
                    )}
                  </View>

                  {/* Send Message to Winning Dealer */}
                  <View style={[styles.msgCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.msgLabel, { color: colors.foreground }]}>
                      Send Message to Winning Dealer ({highestBidder}):
                    </Text>
                    <View style={styles.msgInputRow}>
                      <TextInput
                        style={[styles.msgInput, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. Seller agreed to sell at ₹4.25L. Please confirm payment..."
                        placeholderTextColor={colors.mutedForeground}
                        value={adminDealerMsgText}
                        onChangeText={setAdminDealerMsgText}
                        multiline
                      />
                      <TouchableOpacity style={styles.sendBtn} onPress={handleSendDealerMsg} activeOpacity={0.8}>
                        <Send size={13} color="#0D0E12" />
                        <Text style={styles.sendBtnText}>Send Message</Text>
                      </TouchableOpacity>
                    </View>
                    {dealerReply && (
                      <View style={styles.dealerReplyBox}>
                        <Text style={styles.dealerReplyTitle}>Dealer Reply Received:</Text>
                        <Text style={[styles.dealerReplyBody, { color: colors.mutedForeground }]}>
                          "{dealerReply.reply}"
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Real-time Bidding Feed / Activity Log */}
              <View style={styles.feedSection}>
                <View style={styles.feedHeader}>
                  <View style={styles.feedTitleRow}>
                    <Activity size={15} color="#FFC700" />
                    <Text style={[styles.feedTitle, { color: colors.mutedForeground }]}>
                      LIVE BIDDING STREAM LOG ({bidHistory.length})
                    </Text>
                  </View>
                  <View style={[styles.feedLivePill, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                    <View style={styles.feedLiveDot} />
                    <Text style={[styles.feedLiveText, { color: colors.mutedForeground }]}>Live Telemetry</Text>
                  </View>
                </View>

                {bidHistory.length === 0 ? (
                  <View style={[styles.feedEmpty, { borderColor: colors.border }]}>
                    <History size={30} color={colors.mutedForeground} />
                    <Text style={[styles.feedEmptyTitle, { color: colors.foreground }]}>No bids recorded in this room yet</Text>
                    <Text style={[styles.feedEmptySub, { color: colors.mutedForeground }]}>
                      Awaiting initial bid placement from connected registered dealers.
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator style={styles.feedTableScroll}>
                    <View style={[styles.feedTable, { borderColor: colors.border, backgroundColor: isDark ? '#0F111A' : '#FFFFFF' }]}>
                      <View style={[styles.feedTableHead, { backgroundColor: isDark ? '#1A1D28' : '#EEF0F6' }]}>
                        <Text style={[styles.feedTh, styles.feedThDealer, { color: colors.mutedForeground }]}>RANK & DEALER</Text>
                        <Text style={[styles.feedTh, styles.feedThAmount, { color: colors.mutedForeground }]}>BID AMOUNT</Text>
                        <Text style={[styles.feedTh, styles.feedThTime, { color: colors.mutedForeground }]}>TIME PLACED</Text>
                      </View>
                      {bidHistory.map((b, idx) => {
                        const isWinner = idx === 0;
                        const prevAmount = idx < bidHistory.length - 1 ? bidHistory[idx + 1].amount : selectedRoom.suggestedPrice || 0;
                        const diff = b.amount - prevAmount;
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.feedRow,
                              { backgroundColor: isWinner ? 'rgba(255,199,0,0.05)' : 'transparent' },
                              { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,110,140,0.12)' },
                            ]}
                          >
                            <View style={styles.feedColDealer}>
                              <View
                                style={[
                                  styles.rankBadge,
                                  isWinner
                                    ? { backgroundColor: '#FFC700' }
                                    : { backgroundColor: isDark ? '#1A1D28' : '#EEF0F6', borderColor: colors.border },
                                ]}
                              >
                                <Text style={[styles.rankBadgeText, { color: isWinner ? '#0D0E12' : colors.mutedForeground }]}>
                                  {idx + 1}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={styles.dealerNameRow}>
                                  <Text style={[styles.dealerName, { color: colors.foreground }]}>
                                    {b.dealer}
                                  </Text>
                                  {isWinner && (
                                    <View style={styles.leadingBadge}>
                                      <Crown size={11} color="#10B981" />
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>
                            <View style={styles.feedColAmount}>
                              <Text style={[styles.feedAmount, { color: isWinner ? '#FFC700' : colors.foreground }]}>
                                {inr(b.amount)}
                              </Text>
                              {diff > 0 && (
                                <View style={styles.feedDiffRow}>
                                  <TrendingUp size={9} color="#10B981" />
                                  <Text style={styles.feedDiff}>+{inr(diff)}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.feedColTime, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {formatIndianDateTime(b.time)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
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

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  emptyState: { borderRadius: 22, borderWidth: 1, padding: 28, alignItems: 'center' },
  gavelIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,199,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginTop: 8 },
  goAuctionsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFC700', borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 13, marginTop: 18,
    shadowColor: '#FFC700', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  goAuctionsBtnText: { color: '#0D0E12', fontSize: 12, fontWeight: '900' },

  // List
  listContainer: { padding: 14, gap: 14, paddingBottom: 40 },

  // Telemetry Banner
  telemetryBanner: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden', position: 'relative' },
  bannerGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  bannerTitleWrap: { flex: 1 },
  bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bannerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  activeRoomsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  activeRoomsText: { fontSize: 9, fontWeight: '900', color: '#FFC700' },
  bannerSub: { fontSize: 10, fontWeight: '600', marginTop: 5, lineHeight: 15 },
  manageAuctionsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFC700', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#FFC700', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  manageAuctionsBtnText: { color: '#0D0E12', fontSize: 10, fontWeight: '900' },

  // Section Header
  sectionHeader: { marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Search Bar
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', padding: 0 },

  // Room Cards
  roomCard: { borderRadius: 16, borderWidth: 1, padding: 14, position: 'relative', overflow: 'hidden' },
  roomAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3.5, backgroundColor: '#FFC700', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  roomTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  roomLiveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  roomLiveText: { fontSize: 9, fontWeight: '900', color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 },
  roomRegPill: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 6, borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.2)', paddingHorizontal: 8, paddingVertical: 3,
  },
  roomRegText: { fontSize: 10, fontWeight: '900', color: '#FFC700', letterSpacing: 0.5, textTransform: 'uppercase' },
  roomName: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  roomVariant: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  roomFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  roomFooterLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  roomFooterBid: { fontSize: 12, fontWeight: '900', color: '#FFC700', marginTop: 1 },
  roomTimer: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  roomTimerText: { fontSize: 10.5, fontWeight: '800' },

  // No Match
  noMatchBox: { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', padding: 22, alignItems: 'center' },
  noMatchText: { fontSize: 11, fontWeight: '700' },

  // Monitor Card
  monitorCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', position: 'relative' },
  monitorGlow: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90 },
  monitorHeader: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  monitorHeaderTop: { marginBottom: 12 },
  monitorHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  monitorRegPill: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.25)', paddingHorizontal: 9, paddingVertical: 4,
  },
  monitorRegText: { fontSize: 10, fontWeight: '900', color: '#FFC700', letterSpacing: 0.6, textTransform: 'uppercase' },
  monitorStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  monitorStatusDot: { width: 6, height: 6, borderRadius: 3 },
  monitorStatusText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
  monitorVehicleName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  monitorVariant: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },

  // Monitor Actions
  monitorActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  copyLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
  },
  copyLinkText: { color: '#3B82F6', fontSize: 10.5, fontWeight: '900' },
  countdownPill: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  countdownIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  countdownLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  countdownValue: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, fontVariant: ['tabular-nums'] },

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  metricCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 12 },
  metricCardHighlight: { backgroundColor: 'rgba(255,199,0,0.05)' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  metricLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  metricIcon: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: 'rgba(100,110,140,0.1)', borderWidth: 1, borderColor: 'rgba(100,110,140,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  metricValue: { fontSize: 15, fontWeight: '900' },
  metricSub: { fontSize: 8.5, fontWeight: '600', marginTop: 2 },

  // Post Auction
  postAuctionWrap: { gap: 12, marginTop: 14 },
  outcomeBanner: { borderRadius: 16, borderWidth: 1, padding: 16 },
  outcomeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  outcomeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  outcomeTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  outcomeSub: { fontSize: 10.5, fontWeight: '600', marginTop: 3, lineHeight: 15 },
  soldOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#10B981', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 12,
  },
  soldOutBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  sellerRespBox: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.1)', padding: 13,
  },
  sellerRespHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  sellerRespTitle: { fontSize: 10.5, fontWeight: '900', color: '#D97706' },
  sellerRespStatus: { fontSize: 9.5, fontWeight: '800', color: '#D97706' },
  sellerRespBody: { fontSize: 11, fontWeight: '600', marginTop: 6, lineHeight: 17 },
  sellerAgreed: { fontWeight: '900', color: '#059669' },
  sellerNotAgreed: { fontWeight: '900', color: '#B45309' },
  sellerRespMsg: { fontStyle: 'italic', opacity: 0.9 },
  msgCard: { borderRadius: 14, borderWidth: 1, padding: 13 },
  msgLabel: { fontSize: 11.5, fontWeight: '800', marginBottom: 9 },
  msgInputRow: { gap: 8 },
  msgInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 11.5, fontWeight: '600', minHeight: 48, maxHeight: 90 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#FFC700', borderRadius: 12,
    paddingVertical: 11,
  },
  sendBtnText: { color: '#0D0E12', fontSize: 11.5, fontWeight: '900' },
  dealerReplyBox: {
    marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.1)', padding: 11,
  },
  dealerReplyTitle: { fontSize: 10, fontWeight: '900', color: '#3B82F6', marginBottom: 4 },
  dealerReplyBody: { fontSize: 11, fontWeight: '600', fontStyle: 'italic' },

  // Bidding Feed
  feedSection: { marginTop: 18 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  feedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  feedTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  feedLivePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  feedLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  feedLiveText: { fontSize: 8.5, fontWeight: '800' },
  feedEmpty: { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 34, alignItems: 'center', gap: 8 },
  feedEmptyTitle: { fontSize: 12, fontWeight: '800' },
  feedEmptySub: { fontSize: 10, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
  feedTableScroll: { marginTop: 2 },
  feedTable: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', minWidth: 550 },
  feedTableHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  feedTh: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  feedThDealer: { width: 210, paddingHorizontal: 12 },
  feedThAmount: { width: 130, paddingHorizontal: 12 },
  feedThTime: { width: 210, paddingHorizontal: 12, textAlign: 'right' },
  feedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 0.5 },
  feedColDealer: { width: 210, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  rankBadge: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  rankBadgeText: { fontSize: 11, fontWeight: '900' },
  dealerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealerName: { fontSize: 12, fontWeight: '800', flexShrink: 1 },
  leadingBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  feedColAmount: { width: 130, flexDirection: 'column', alignItems: 'flex-start', gap: 1, paddingHorizontal: 12 },
  feedAmount: { fontSize: 13, fontWeight: '900' },
  feedDiffRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  feedDiff: { fontSize: 8.5, fontWeight: '800', color: '#10B981' },
  feedColTime: { width: 210, paddingHorizontal: 12, textAlign: 'right' },
});
