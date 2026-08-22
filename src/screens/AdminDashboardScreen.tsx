import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Zap,
  Sparkles,
  ArrowUpRight,
  Car,
  CheckCircle2,
  Gavel,
  TrendingUp,
  Users,
  User,
  Building2,
  Store,
  ReceiptText,
  ChevronRight,
  Menu,
  RefreshCw,
  Send,
  Copy,
  BadgeIndianRupee,
  Crown,
  Activity,
  RadioTower,
  Flame,
  ShieldCheck, Download,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { freelancerService } from '../services/freelancerService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface AdminDashboardScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

// Custom SVG Area Chart Component
interface AreaChartItem {
  month: string;
  bids: number;
}

const SvgAreaChart: React.FC<{ data: AreaChartItem[]; colors: any; theme: string }> = ({ data, colors, theme }) => {
  const chartHeight = 130;
  const paddingLeft = 32;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const [chartWidth, setChartWidth] = useState(300);

  const maxVal = Math.max(...data.map(d => d.bids), 10);
  const gridLines = 4;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = (chartWidth - paddingLeft - paddingRight) / Math.max(data.length - 1, 1);
    return data.map((d, index) => {
      const x = paddingLeft + index * stepX;
      const y = paddingTop + (chartHeight - paddingTop - paddingBottom) * (1 - d.bids / maxVal);
      return { x, y, val: d.bids, label: d.month };
    });
  }, [data, chartWidth, maxVal]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  }, [points]);

  const fillD = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const zeroY = chartHeight - paddingBottom;
    return `${pathD} L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
  }, [points, pathD]);

  return (
    <View style={{ height: chartHeight + 10, width: '100%' }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={chartHeight}>
        <Defs>
          <LinearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFC700" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FFC700" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {Array.from({ length: gridLines }).map((_, idx) => {
          const y = paddingTop + ((chartHeight - paddingTop - paddingBottom) / (gridLines - 1)) * idx;
          const gridVal = Math.round(maxVal * (1 - idx / (gridLines - 1)));
          return (
            <React.Fragment key={idx}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill={colors.mutedForeground}
                fontSize="8.5"
                fontWeight="700"
                textAnchor="end"
              >
                {gridVal}
              </SvgText>
            </React.Fragment>
          );
        })}

        {fillD ? <Path d={fillD} fill="url(#goldGlow)" /> : null}
        {pathD ? <Path d={pathD} stroke="#FFC700" strokeWidth="2.5" fill="none" /> : null}

        {points.map((p, idx) => (
          <React.Fragment key={idx}>
            <Circle cx={p.x} cy={p.y} r="3" fill="#FFC700" stroke={colors.card} strokeWidth="1.5" />
            <SvgText
              x={p.x}
              y={chartHeight - 8}
              fill={colors.mutedForeground}
              fontSize="7.5"
              fontWeight="700"
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

// Custom SVG Donut Chart Component
interface PieChartItem {
  name: string;
  value: number;
  pct: number;
  color: string;
}

const SvgDonutChart: React.FC<{ data: PieChartItem[]; colors: any; theme: string }> = ({ data, colors, theme }) => {
  const radius = 35;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const validData = data.filter(d => d.value > 0);
  const totalValue = validData.reduce((acc, d) => acc + d.value, 0);

  let accumulatedPercent = 0;

  return (
    <View style={{ flexDirection: 'column', alignItems: 'center', marginVertical: 12 }}>
      <View style={{ width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          {totalValue === 0 ? (
            <Circle cx="50" cy="50" r={radius} fill="none" stroke={theme === 'dark' ? '#27272A' : '#E2E8F0'} strokeWidth={strokeWidth} />
          ) : (
            validData.map((d, index) => {
              const strokeLength = (d.value / totalValue) * circumference;
              const strokeOffset = circumference - strokeLength;
              const rotation = (accumulatedPercent / totalValue) * 360;
              accumulatedPercent += d.value;

              return (
                <Circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(${rotation - 90} 50 50)`}
                />
              );
            })
          )}
        </Svg>
      </View>

      <View style={{ width: '100%', gap: 10, paddingHorizontal: 4 }}>
        {data.map((item, idx) => (
          <View key={idx} style={styles.pieLegendRow}>
            <View style={styles.pieLegendLeft}>
              <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.pieLegendName, { color: colors.foreground }]}>
                {item.name}
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.foreground }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Telemetry States
  const [inspections, setInspections] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [freelancersCount, setFreelancersCount] = useState<number>(0);

  // Message Sending states mapped by inspectionId
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [sendingMsg, setSendingMsg] = useState<Record<number, boolean>>({});
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (id: number) => {
    setDownloadingPdfId(id);
    try {
      await adminService.downloadAdminPdf(id);
    } catch {
      // silent download
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [insRes, dealRes, freeUsersRes, freeInsRes] = await Promise.all([
        adminService.getSubmittedInspections(), 
        adminService.getRegisteredDealers(), 
        adminService.getRegisteredFreelancers(),
        freelancerService.getMyInspections()
      ]);
      
      let combinedInspections: any[] = [];
      if (insRes.success && insRes.data) {
        combinedInspections = [...insRes.data];
      }
      if (freeInsRes?.success && freeInsRes?.data) {
        const freeIns = freeInsRes.data.map((item: any) => {
          let curStatus = String(item.status || item.vehicleStatus || 'APPROVED').toUpperCase();
          if (['SUBMITTED', 'PENDING', 'PENDING_APPROVAL'].includes(curStatus)) {
            curStatus = 'APPROVED';
          }
          return {
            ...item,
            inspectionId: item.inspectionId || item.id,
            vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || `INS-${item.id}`,
            sourceType: 'FREELANCER',
            status: curStatus,
          };
        });
        combinedInspections = [...combinedInspections, ...freeIns];
      }
      setInspections(combinedInspections);
      if (dealRes.success && dealRes.data) { setDealers(dealRes.data); }
      if (freeUsersRes?.success && freeUsersRes?.data) { setFreelancersCount(freeUsersRes.data.length); } else if (Array.isArray(freeUsersRes)) { setFreelancersCount(freeUsersRes.length); }
    } catch (err: any) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const inr = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = inspections.length;
    const approved = inspections.filter((ins) => ins.status === 'APPROVED').length;
    const running = inspections.filter((ins) => ins.status === 'APPROVED' && ins.vehicleStatus === 'LIVE').length;
    const pending = inspections.filter((ins) => ins.status === 'SUBMITTED').length;

    const uniqueInspectors = new Set(
      inspections.map((ins) => ins.inspectorName).filter(Boolean)
    ).size;

    return {
      total,
      approved,
      running,
      pending,
      inspectors: uniqueInspectors,
      dealers: dealers.length,
      freelancers: freelancersCount,
    };
  }, [inspections, dealers]);

  const liveAuctions = useMemo(() => {
    return inspections.filter((ins) => ins.status === 'APPROVED' && ins.vehicleStatus === 'LIVE');
  }, [inspections]);

  const negotiationAuctions = useMemo(() => {
    return inspections.filter(
      (ins) =>
        ins.vehicleStatus === 'ENDED' ||
        ins.vehicleStatus === 'AUCTION ENDED' ||
        ins.vehicleStatus === 'AUCTION_ENDED' ||
        ins.vehicleStatus === 'COMPLETED'
    );
  }, [inspections]);

  // Operational pipeline breakdown
  const inspectionBreakdown = useMemo(() => {
    const approved = inspections.filter((ins) => ins.status === 'APPROVED').length;
    const pending = inspections.filter((ins) => ins.status === 'SUBMITTED').length;
    const rejected = inspections.filter((ins) => ins.status === 'REJECTED').length;
    const drafts = inspections.filter(
      (ins) => ins.status === 'DRAFT' || ins.status === 'IN_PROGRESS'
    ).length;

    const total = approved + pending + rejected + drafts || 1;

    return [
      { name: 'Approved', value: approved, pct: Math.round((approved / total) * 100), color: '#10B981' },
      { name: 'Pending Approval', value: pending, pct: Math.round((pending / total) * 100), color: '#FFC700' },
      { name: 'Rejected', value: rejected, pct: Math.round((rejected / total) * 100), color: '#EF4444' },
      { name: 'Drafts', value: drafts, pct: Math.round((drafts / total) * 100), color: '#696974' },
    ];
  }, [inspections]);

  // Operations monthly bidding volumes
  const monthlyBidsVolume = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts: Record<string, number> = {};
    months.forEach((m) => { counts[m] = 0; });

    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const d = new Date(ins.submittedAt);
      const mName = months[d.getMonth()];
      if (counts[mName] !== undefined) {
        counts[mName] += (ins.totalBids || 0);
      }
    });

    return months.map((m) => ({ month: m, bids: counts[m] }));
  }, [inspections]);

  // Export summary operations report
  const handleSendMessage = async (id: number) => {
    const msg = messages[id]?.trim();
    if (!msg) {
      showToast({ message: 'Please enter a message for the winning dealer.', type: 'warning' });
      return;
    }

    setSendingMsg((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await adminService.sendAdminDealerMessage(id, msg);
      if (res.success) {
        showToast({ message: 'Message sent to winning dealer successfully!', type: 'success' });
        setMessages((prev) => ({ ...prev, [id]: '' }));
        fetchAdminData();
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to send message.', type: 'error' });
    } finally {
      setSendingMsg((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Mark vehicle status as SOLD OUT manually
  const handleMarkSoldOut = async (id: number, brand: string, model: string) => {
    Alert.alert(
      'Confirm Sold Out',
      `Are you sure you want to mark vehicle #${id} (${brand} ${model}) as SOLD OUT?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await adminService.updateInspectionVehicleStatus(id, 'SOLD OUT');
              if (res.success) {
                showToast({ message: 'Vehicle status updated to SOLD OUT!', type: 'success' });
                fetchAdminData();
              }
            } catch (err: any) {
              showToast({ message: err.message || 'Failed to update status.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleCopyPublicLink = (roomId: number, brand: string, model: string) => {
    const link = `https://caryanamlive.com/public-bid/${roomId}`;
    Clipboard.setString(link);
    showToast({
      message: `Copied Public Bidding Link for ${brand} ${model}!`,
      type: 'success',
    });
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const tileBg = isDark ? '#151824' : '#F0F2F7';

  const shortcuts = [
    { label: 'Manage Live Bidding', desc: `${stats.running} active auction rooms`, color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: Gavel, action: () => navigation.navigate('AdminLiveBidding') },
    { label: 'Review Inventory', desc: `${stats.pending} pending approvals`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: ReceiptText, action: () => navigation.navigate('AdminVehicles') },
    { label: 'Dealers Network', desc: `${stats.dealers} onboarded buyers`, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Store, action: () => navigation.navigate('AdminDealers') },
  ];

  const statCards = [
    { icon: Car, label: 'Total Inventory', value: stats.total, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', delta: 'Registered vehicles' },
    { icon: CheckCircle2, label: 'Inspected & Approved', value: stats.approved, color: '#10B981', bg: 'rgba(16,185,129,0.12)', delta: 'Ready for auction' },
    { icon: Gavel, label: 'Running Auctions', value: stats.running, color: '#FFC700', bg: 'rgba(255,199,0,0.12)', delta: 'Live right now' },
    { icon: TrendingUp, label: 'Pending Reviews', value: stats.pending, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', delta: 'Needs attention' },
    { icon: Users, label: 'Active Inspectors', value: stats.inspectors, color: '#6366F1', bg: 'rgba(99,102,241,0.12)', delta: 'Field partners' },
    { icon: User, label: 'Total Freelancers', value: stats.freelancers, color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', delta: 'Freelancer submitters' },
    { icon: Building2, label: 'Verified Dealers', value: stats.dealers, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', delta: 'Onboarded buyers' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerCrown}>
            <Zap size={12} color="#0D0E12" fill="#0D0E12" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin</Text>
        </View>
        <View style={styles.headerRightActions}>
          <AdminNotificationsModal />
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
          {/* Welcome Hero Banner */}
          <View style={styles.hero}>
            <View style={[styles.heroGlowTop, { backgroundColor: isDark ? 'rgba(255,199,0,0.10)' : 'rgba(255,199,0,0.14)' }]} />
            <View style={[styles.heroGlowBottom, { backgroundColor: isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.09)' }]} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconTile}>
                <Zap size={22} color="#0D0E12" fill="#0D0E12" />
              </View>
              <View style={styles.heroTextBlock}>
                <View style={styles.heroEyebrowRow}>
                  <Sparkles size={9} color="#FFC700" />
                  <Text style={styles.heroEyebrow}>ADMIN COMMAND CENTER</Text>
                </View>
                <Text style={styles.heroTitle}>Enterprise Operations</Text>
                <Text style={styles.heroSubtitle}>
                  {stats.running} live auctions • {stats.dealers} dealers • {stats.pending} pending
                </Text>
              </View>
              <View style={styles.heroLiveChip}>
                <View style={styles.heroPingDot} />
                <Activity size={10} color="#10B981" />
                <Text style={styles.heroLiveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.heroAccentBar}>
              <View style={styles.heroAccentGold} />
              <View style={styles.heroAccentGreen} />
            </View>
          </View>

          {/* Stats cards grid */}
          <View style={styles.statsGrid}>
            {[0, 2, 4].map((start) => (
              <View key={start} style={styles.statsRow}>
                {statCards.slice(start, start + 2).map((s, i) => (
                  <View key={i} style={[styles.statCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
                    <View style={[styles.statAccent, { backgroundColor: s.color }]} />
                    <View style={[styles.statIconTile, { backgroundColor: s.bg }]}>
                      <s.icon size={16} color={s.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{loading ? '...' : s.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                    <View style={styles.statDeltaRow}>
                      <ArrowUpRight size={10} color={s.color} />
                      <Text style={[styles.statDelta, { color: s.color }]}>{s.delta}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Quick Actions Panel */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', marginBottom: 18 }]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelAccentBar} />
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Quick Shortcuts</Text>
            </View>
            <View style={styles.shortcutList}>
              {shortcuts.map((s, idx) => (
                <TouchableOpacity key={idx} style={[styles.shortcutItem, { borderBottomColor: isDark ? colors.border : 'rgba(100,110,150,0.15)' }]} onPress={s.action} activeOpacity={0.7}>
                  <View style={[styles.shortcutIconTile, { backgroundColor: s.bg }]}>
                    <s.icon size={15} color={s.color} />
                  </View>
                  <View style={styles.shortcutContent}>
                    <Text style={[styles.shortcutLabel, { color: colors.foreground }]}>{s.label}</Text>
                    <Text style={[styles.shortcutDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(148, 163, 184, 0.4)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Operations Bidding Volume Card */}
          {monthlyBidsVolume.length > 0 && (
            <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', marginBottom: 18 }]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelAccentBar} />
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Operations Bidding Volume</Text>
              </View>
              <Text style={[styles.panelSub, { color: colors.mutedForeground, marginBottom: 14 }]}>
                Bidding density indicators
              </Text>
              <SvgAreaChart data={monthlyBidsVolume} colors={colors} theme={theme} />

              <View style={styles.chartList}>
                {monthlyBidsVolume.filter(item => item.bids > 0).map((item, idx) => (
                  <View key={idx} style={[styles.chartRow, { backgroundColor: tileBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.12)' }]}>
                    <Text style={[styles.chartRowMonth, { color: colors.foreground }]}>{item.month}</Text>
                    <View style={styles.chartRowRight}>
                      <Gavel size={12} color="#FFC700" />
                      <Text style={styles.chartRowValue}>{item.bids} bids</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Inspection Pipeline Card */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', marginBottom: 18 }]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelAccentBar} />
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Inspection Pipeline</Text>
            </View>
            <Text style={[styles.panelSub, { color: colors.mutedForeground, marginBottom: 14 }]}>
              Status ratio breakdown
            </Text>
            <SvgDonutChart data={inspectionBreakdown} colors={colors} theme={theme} />
          </View>

          {/* Live Operations Activity */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', marginBottom: 18 }]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelAccentBar} />
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Live Operations Activity</Text>
            </View>
            <View style={styles.activityList}>
              <View style={[styles.activityItem, { backgroundColor: tileBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.12)' }]}>
                <View style={[styles.activityIconTile, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <RadioTower size={15} color="#10B981" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>Registered Dealers Sync</Text>
                  <Text style={[styles.activityDesc, { color: colors.mutedForeground }]}>{stats.dealers} active buying nodes connected</Text>
                  <View style={styles.activityBadgeRow}>
                    <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.activityBadge, { color: '#10B981' }]}>SYNCED REALTIME</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.activityItem, { backgroundColor: tileBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.12)' }]}>
                <View style={[styles.activityIconTile, { backgroundColor: 'rgba(255,199,0,0.12)' }]}>
                  <Flame size={15} color="#FFC700" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>Live Vehicle Audit</Text>
                  <Text style={[styles.activityDesc, { color: colors.mutedForeground }]}>{stats.total} total inspections registered</Text>
                  <View style={styles.activityBadgeRow}>
                    <View style={[styles.activityDot, { backgroundColor: '#FFC700' }]} />
                    <Text style={[styles.activityBadge, { color: '#FFC700' }]}>ACTIVE NETWORK</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Active Live Auctions */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', marginBottom: 18 }]}>
            <View style={styles.panelHeader}>
              <View style={[styles.panelAccentBar, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Active Auction Rooms</Text>
              {liveAuctions.length > 0 && (
                <View style={styles.panelCountChip}>
                  <Text style={styles.panelCountText}>{liveAuctions.length}</Text>
                </View>
              )}
            </View>
            {loading ? (
              <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 30 }} />
            ) : liveAuctions.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No auctions currently running live.</Text>
              </View>
            ) : (
              <View style={styles.liveRoomsContainer}>
                {liveAuctions.map((room, idx) => {
                  const highestBid = room.currentHighestBid || room.suggestedPrice || 0;
                  const bidder = room.currentHighestBidder || 'No bids placed';

                  return (
                    <View key={room.inspectionId} style={[styles.liveCard, { backgroundColor: tileBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.15)' }]}>
                      <View style={[styles.liveAccentTop, { backgroundColor: 'rgba(16,185,129,0.45)' }]} />
                      <View style={styles.liveHeader}>
                        <View style={styles.liveBadge}>
                          <View style={styles.pingDot} />
                          <Activity size={9} color="#10B981" />
                          <Text style={styles.liveBadgeText}>LIVE AUCTION</Text>
                        </View>
                        <Text style={[styles.liveId, { color: colors.mutedForeground }]}>ROOM #{idx + 1}</Text>
                      </View>

                      <Text style={[styles.liveTitle, { color: colors.foreground }]}>
                        {room.brand} {room.model} {room.variant}
                      </Text>
                      <Text style={[styles.liveSub, { color: colors.mutedForeground }]}>
                        {room.vehicleNumber} • Suggested: {room.suggestedPrice ? inr(room.suggestedPrice) : 'N/A'}
                      </Text>

                      <View style={[styles.bidStatusBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.25)' }]}>
                        <View style={styles.bidHeaderRow}>
                          <View style={styles.bidHeaderLeft}>
                            <Crown size={12} color="#FFC700" />
                            <Text style={styles.bidLabel}>HIGHEST BID</Text>
                          </View>
                          <BadgeIndianRupee size={13} color="#10B981" />
                        </View>
                        <Text style={[styles.bidValue, { color: '#10B981' }]}>{inr(highestBid)}</Text>
                        <Text style={[styles.bidderText, { color: colors.mutedForeground }]} numberOfLines={1}>
                          Bidder: {bidder}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <TouchableOpacity
                          style={[styles.copyBtn, { flex: 1, borderColor: 'rgba(59,130,246,0.35)', marginTop: 0 }]}
                          onPress={() => handleCopyPublicLink(room.inspectionId, room.brand, room.model)}
                          activeOpacity={0.8}
                        >
                          <Copy size={13} color="#3B82F6" style={{ marginRight: 6 }} />
                          <Text style={styles.copyBtnText}>Copy Bidding Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.copyBtn, { borderColor: 'rgba(255,199,0,0.35)', backgroundColor: 'rgba(255,199,0,0.08)', marginTop: 0, paddingHorizontal: 12 }]}
                          disabled={downloadingPdfId === room.inspectionId}
                          onPress={() => handleDownloadPdf(room.inspectionId)}
                          activeOpacity={0.8}
                        >
                          {downloadingPdfId === room.inspectionId ? (
                            <ActivityIndicator size="small" color="#FFC700" />
                          ) : (
                            <Download size={13} color="#FFC700" style={{ marginRight: 5 }} />
                          )}
                          <Text style={[styles.copyBtnText, { color: '#FFC700' }]}>PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Post-Auction Negotiation & Status Control Center */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <View style={styles.panelHeader}>
              <View style={[styles.panelAccentBar, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Post-Auction Negotiation Center</Text>
              {negotiationAuctions.length > 0 && (
                <View style={[styles.panelCountChip, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }]}>
                  <Text style={[styles.panelCountText, { color: '#F59E0B' }]}>{negotiationAuctions.length}</Text>
                </View>
              )}
            </View>
            {loading ? (
              <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 30 }} />
            ) : negotiationAuctions.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No vehicles in negotiation status.</Text>
              </View>
            ) : (
              <View style={styles.negoContainer}>
                {negotiationAuctions.map((room) => {
                  const bidAmount = room.currentHighestBid || room.suggestedPrice || 0;
                  const winner = room.currentHighestBidder || 'No bids';
                  const hasSellerResp = room.sellerAgreed !== undefined && room.sellerAgreed !== null;

                  return (
                    <View key={room.inspectionId} style={[styles.negoCard, { borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)', backgroundColor: tileBg }]}>
                      <View style={[styles.negoAccentLeft, { backgroundColor: 'rgba(245,158,11,0.5)' }]} />
                      <View style={styles.negoCardHeader}>
                        <View style={styles.negoBadge}>
                          <Activity size={9} color="#F59E0B" />
                          <Text style={styles.negoBadgeText}>NEGOTIATION</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.soldOutBtn}
                          onPress={() => handleMarkSoldOut(room.inspectionId, room.brand, room.model)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.soldOutBtnText}>Mark SOLD OUT</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.negoTitle, { color: colors.foreground }]}>
                        {room.brand} {room.model} {room.variant}
                      </Text>
                      <Text style={[styles.negoSubtitle, { color: colors.mutedForeground }]}>
                        {room.vehicleNumber} • Winner: {winner} ({inr(bidAmount)})
                      </Text>

                      <View style={[styles.responseBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                        <View style={styles.responseHeader}>
                          <View style={styles.responseHeaderLeft}>
                            <ShieldCheck size={12} color="#F59E0B" />
                            <Text style={styles.responseTextTitle}>Seller Response:</Text>
                          </View>
                          <Text style={styles.responseTextStatus}>
                            {hasSellerResp ? 'Received' : 'Awaiting Seller'}
                          </Text>
                        </View>
                        {hasSellerResp ? (
                          <Text style={[styles.responseTextDetail, { color: colors.foreground }]}>
                            Decision: {room.sellerAgreed ? 'AGREED TO SELL' : `REJECTED (Wants ${inr(room.sellerCounterPrice || 0)})`}
                            {room.sellerMessage ? `\nNote: "${room.sellerMessage}"` : ''}
                          </Text>
                        ) : (
                          <Text style={styles.responseTextAwaiting}>
                            Awaiting confirmation response from seller...
                          </Text>
                        )}
                      </View>

                      <View style={styles.messageForm}>
                        <Text style={[styles.messageFormLabel, { color: colors.mutedForeground }]}>
                          SEND MESSAGE TO WINNING DEALER:
                        </Text>
                        <View style={[styles.messageInputWrapper, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
                          <TextInput
                            style={[styles.messageInput, { color: colors.foreground }]}
                            placeholder="e.g. Seller agreed to sell at ₹4.25L. Please confirm..."
                            placeholderTextColor={colors.mutedForeground}
                            value={messages[room.inspectionId] || ''}
                            onChangeText={(v) => setMessages((prev) => ({ ...prev, [room.inspectionId]: v }))}
                          />
                          <TouchableOpacity
                            style={styles.messageSendBtn}
                            onPress={() => handleSendMessage(room.inspectionId)}
                            disabled={sendingMsg[room.inspectionId]}
                          >
                            {sendingMsg[room.inspectionId] ? (
                              <ActivityIndicator color="#0D0E12" size="small" />
                            ) : (
                              <Send size={15} color="#0D0E12" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {room.adminDealerMessage && (
                          <Text style={styles.lastSentMessage}>
                            Last Sent: "{room.adminDealerMessage}"
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCrown: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentBody: {
    padding: 16,
  },

  // Hero
  hero: {
    backgroundColor: '#0D0E12',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowTop: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  heroEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFC700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '700',
    marginTop: 3,
  },
  heroLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroLiveText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  heroAccentBar: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 14,
  },
  heroAccentGold: {
    flex: 1,
    backgroundColor: '#FFC700',
  },
  heroAccentGreen: {
    flex: 1,
    backgroundColor: '#10B981',
  },

  // Stats
  statsGrid: {
    marginBottom: 18,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 3,
  },
  statDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  statDelta: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Panel
  panel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  panelAccentBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FFC700',
  },
  panelTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flex: 1,
  },
  panelSub: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  panelCountChip: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  panelCountText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
  },
  emptyView: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Shortcuts
  shortcutList: {
    gap: 4,
    marginTop: 8,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 10,
  },
  shortcutIconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  shortcutDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  // Chart list
  chartList: {
    gap: 8,
    marginTop: 14,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chartRowMonth: {
    fontSize: 12,
    fontWeight: '800',
  },
  chartRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartRowValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFC700',
  },

  // Pie legend
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pieLegendName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pieLegendPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pieLegendPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Activity
  activityList: {
    gap: 10,
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 11,
  },
  activityIconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  activityDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  activityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  activityBadge: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Live rooms
  liveRoomsContainer: {
    gap: 14,
    marginTop: 10,
  },
  liveCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  liveAccentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  liveId: {
    fontSize: 10,
    fontWeight: '700',
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  liveSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  bidStatusBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  bidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bidHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bidLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  bidValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  bidderText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  copyBtn: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3B82F6',
  },

  // Negotiation
  negoContainer: {
    gap: 12,
    marginTop: 10,
  },
  negoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  negoAccentLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3.5,
  },
  negoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  negoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  negoBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  soldOutBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  soldOutBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  negoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  negoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  responseBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  responseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  responseTextTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  responseTextStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  responseTextDetail: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  responseTextAwaiting: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#F59E0B',
    opacity: 0.8,
  },
  messageForm: {
    width: '100%',
  },
  messageFormLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  messageInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  messageSendBtn: {
    backgroundColor: '#FFC700',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  lastSentMessage: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },
});