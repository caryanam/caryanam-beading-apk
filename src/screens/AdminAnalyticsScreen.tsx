import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Svg, Path, Line, Text as SvgText, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Menu,
  RefreshCw,
  ChartBarBig,
  IndianRupee,
  Percent,
  Users,
  Car,
  Download,
  Gavel,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

// Ported from web: src/lib/utils.ts — parses "2026-08-11T17:20:15.166002" as LOCAL time
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

// Saves a CSV file to the device, like the web browser download.
// Android (10+): stores into the public Downloads folder via MediaStore, then opens the file.
// Android (<10): writes directly to the shared Downloads directory, then opens the file.
// iOS: writes to the app Documents folder and opens the native share sheet.
async function saveCsvFile(filename: string, csvContent: string): Promise<void> {
  if (Platform.OS === 'android') {
    const major = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
    if (major >= 29) {
      const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${filename}`;
      await ReactNativeBlobUtil.fs.writeFile(tempPath, csvContent, 'utf8');
      const contentUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: filename, parentFolder: '', mimeType: 'text/csv' } as any,
        'Download' as any,
        tempPath,
      );
      if (!contentUri) throw new Error('MediaStore returned no URI');
      ReactNativeBlobUtil.android.actionViewIntent(contentUri, 'text/csv').catch(() => undefined);
    } else {
      const dir = ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir;
      const filePath = `${dir}/${filename}`;
      await ReactNativeBlobUtil.fs.writeFile(filePath, csvContent, 'utf8');
      ReactNativeBlobUtil.android.actionViewIntent(filePath, 'text/csv').catch(() => undefined);
    }
    return;
  }
  // iOS — write then share the actual file
  const docPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${filename}`;
  await ReactNativeBlobUtil.fs.writeFile(docPath, csvContent, 'utf8');
  await Share.share({ url: `file://${docPath}`, title: filename });
}

// ── SVG Line Chart (Monthly Bid Volume Trend) ────────────

interface LineChartItem {
  month: string;
  bids: number;
}

const SvgLineChart: React.FC<{ data: LineChartItem[]; colors: any; theme: string }> = ({ data, colors, theme }) => {
  const chartHeight = 150;
  const paddingLeft = 34;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 26;

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
          <LinearGradient id="anaGoldGlow" x1="0" y1="0" x2="0" y2="1">
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

        {fillD ? <Path d={fillD} fill="url(#anaGoldGlow)" /> : null}
        {pathD ? <Path d={pathD} stroke="#FFC700" strokeWidth="2.5" fill="none" /> : null}

        {points.map((p, idx) => (
          <React.Fragment key={idx}>
            <Circle cx={p.x} cy={p.y} r="3.2" fill="#FFC700" stroke={colors.card} strokeWidth="1.5" />
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

// ── SVG Grouped Bar Chart (Submissions vs Approvals) ────

interface BarChartItem {
  month: string;
  Submitted: number;
  Approved: number;
}

const SvgGroupedBarChart: React.FC<{ data: BarChartItem[]; colors: any; theme: string }> = ({ data, colors, theme }) => {
  const chartHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 26;

  const [chartWidth, setChartWidth] = useState(300);
  const plotH = chartHeight - paddingTop - paddingBottom;
  const maxVal = Math.max(...data.flatMap(d => [d.Submitted, d.Approved]), 10);
  const gridLines = 4;

  const groups = useMemo(() => {
    const stepX = (chartWidth - paddingLeft - paddingRight) / Math.max(data.length, 1);
    return data.map((d) => {
      const centerX = paddingLeft + stepX * data.indexOf(d) + stepX / 2;
      const barW = Math.min(stepX * 0.28, 18);
      const barGap = Math.min(stepX * 0.12, 5);
      const barData = [
        { key: 'Submitted', value: d.Submitted, color: '#94A3B8' },
        { key: 'Approved', value: d.Approved, color: '#10B981' },
      ];
      return {
        label: d.month,
        bars: barData.map((b, bi) => {
          const h = (b.value / maxVal) * plotH;
          const x = bi === 0 ? centerX - barGap / 2 - barW : centerX + barGap / 2;
          return { ...b, x, y: paddingTop + plotH - h, h };
        }),
      };
    });
  }, [data, chartWidth, maxVal, plotH]);

  return (
    <View style={{ height: chartHeight + 10, width: '100%' }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={chartHeight}>
        {Array.from({ length: gridLines }).map((_, idx) => {
          const y = paddingTop + (plotH / (gridLines - 1)) * idx;
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

        {groups.map((g, gi) => (
          <React.Fragment key={gi}>
            {g.bars.map((b, bi) => (
              <Rect
                key={`${gi}-${bi}`}
                x={b.x}
                y={b.y}
                width={Math.min((chartWidth - paddingLeft - paddingRight) / Math.max(data.length, 1) * 0.28, 18)}
                height={Math.max(b.h, 0)}
                rx="3"
                fill={b.color}
              />
            ))}
            <SvgText
              x={g.bars[0].x + Math.min((chartWidth - paddingLeft - paddingRight) / Math.max(data.length, 1) * 0.28, 18)}
              y={chartHeight - 8}
              fill={colors.mutedForeground}
              fontSize="7.5"
              fontWeight="700"
              textAnchor="middle"
            >
              {g.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

interface AdminAnalyticsScreenProps {
  onOpenMenu: () => void;
}

export const AdminAnalyticsScreen: React.FC<AdminAnalyticsScreenProps> = ({ onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [dealers, setDealers] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const [dealRes, insRes] = await Promise.all([
        adminService.getRegisteredDealers(),
        adminService.getSubmittedInspections(),
      ]);
      if (dealRes.success && dealRes.data) setDealers(dealRes.data);
      if (insRes.success && insRes.data) setInspections(insRes.data);
      if (showMsg) showToast({ message: 'Analytics refreshed', type: 'success' });
    } catch {
      showToast({ message: 'Failed to load analytics datasets.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => fetchAnalytics(true);

  // ── Metrics ─────────────────────────────────────────────

  const totalInspections = inspections.length;
  const approvedCount = useMemo(() => inspections.filter(ins => ins.status === 'APPROVED').length, [inspections]);
  const liveCount = useMemo(() => inspections.filter(ins => ins.vehicleStatus === 'LIVE').length, [inspections]);
  const totalBidsCount = useMemo(() => inspections.reduce((sum, ins) => sum + (ins.totalBids || 0), 0), [inspections]);
  const grossBiddingValue = useMemo(() => inspections.reduce((sum, ins) => sum + (ins.currentHighestBid || 0), 0), [inspections]);

  const approvalRate = useMemo(() => {
    if (totalInspections === 0) return '0%';
    return `${((approvedCount / totalInspections) * 100).toFixed(1)}%`;
  }, [approvedCount, totalInspections]);

  // ── Monthly aggregations (last 6 months, same as web) ──

  const monthlyBidVolume = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts: Record<string, number> = {};
    const now = new Date();
    const activeMonths: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      activeMonths.push(mName);
      counts[mName] = 0;
    }

    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const parsed = parseDateStringToLocal(ins.submittedAt);
      if (!parsed) return;
      const mName = months[parsed.getMonth()];
      if (counts[mName] !== undefined) counts[mName] += ins.totalBids || 0;
    });

    return activeMonths.map(m => ({ month: m, bids: counts[m] || 0 }));
  }, [inspections]);

  const monthlyVehicleActivity = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const activeMonths: string[] = [];
    const submittedCounts: Record<string, number> = {};
    const approvedCounts: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      activeMonths.push(mName);
      submittedCounts[mName] = 0;
      approvedCounts[mName] = 0;
    }

    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const parsed = parseDateStringToLocal(ins.submittedAt);
      if (!parsed) return;
      const mName = months[parsed.getMonth()];
      if (submittedCounts[mName] !== undefined) {
        submittedCounts[mName] += 1;
        if (ins.status === 'APPROVED') approvedCounts[mName] += 1;
      }
    });

    return activeMonths.map(m => ({ month: m, Submitted: submittedCounts[m] || 0, Approved: approvedCounts[m] || 0 }));
  }, [inspections]);

  // ── CSV Export (via native share sheet) ────────────────

  const today = new Date().toISOString().slice(0, 10);

  const exportInspectionsCSV = async () => {
    if (!inspections.length) {
      showToast({ message: 'No inspection data available to export', type: 'error' });
      return;
    }
    const headers = ['Inspection ID', 'Vehicle Number', 'Brand', 'Model', 'Variant', 'Status', 'Vehicle Status', 'Highest Bid (₹)', 'Total Bids'];
    const rows = inspections.map((i) => [
      i.inspectionId,
      `"${i.vehicleNumber || ''}"`,
      `"${i.brand || ''}"`,
      `"${i.model || ''}"`,
      `"${i.variant || ''}"`,
      i.status,
      i.vehicleStatus || 'N/A',
      i.currentHighestBid || 0,
      i.totalBids || 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const filename = `inspections_report_${today}.csv`;
    try {
      await saveCsvFile(filename, csvContent);
      showToast({ message: `Saved to Downloads: ${filename}`, type: 'success' });
    } catch {
      showToast({ message: 'Failed to export inspections report.', type: 'error' });
    }
  };

  const exportDealersCSV = async () => {
    if (!dealers.length) {
      showToast({ message: 'No dealer data available to export', type: 'error' });
      return;
    }
    const headers = ['Dealer ID', 'Dealership Name', 'Owner Name', 'Email', 'Mobile Number', 'Total Bids', 'Won Bids'];
    const rows = dealers.map((d) => [
      d.id,
      `"${d.dealershipName || ''}"`,
      `"${d.ownerName || ''}"`,
      `"${d.email || ''}"`,
      `"${d.mobileNumber || ''}"`,
      d.totalBids || 0,
      d.wonBidsCount || 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const filename = `dealers_report_${today}.csv`;
    try {
      await saveCsvFile(filename, csvContent);
      showToast({ message: `Saved to Downloads: ${filename}`, type: 'success' });
    } catch {
      showToast({ message: 'Failed to export dealers report.', type: 'error' });
    }
  };

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
          <ChartBarBig size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
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
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading analytics datasets...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255,199,0,0.14)' }]}>
                <IndianRupee size={16} color="#FFC700" />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>₹{grossBiddingValue.toLocaleString('en-IN')}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Gross Bidding Volume</Text>
              <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>{totalBidsCount} total active bids</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(148,163,184,0.14)' }]}>
                <TrendingUp size={16} color="#94A3B8" />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{approvedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Approved Vehicles</Text>
              <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>Out of {totalInspections} submitted</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                <Percent size={16} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{approvalRate}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Approval Rate</Text>
              <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>{liveCount} live in auction</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(59,130,246,0.14)' }]}>
                <Users size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{dealers.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Dealers</Text>
              <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>Enrolled dealer network</Text>
            </View>
          </View>

          {/* Export Buttons */}
          <View style={styles.exportStack}>
            <TouchableOpacity style={styles.exportPrimaryBtn} onPress={exportInspectionsCSV} activeOpacity={0.85}>
              <Download size={15} color="#0D0E12" />
              <Text style={styles.exportPrimaryText}>Export Inspections CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportSecondaryBtn, { borderColor: colors.border }]}
              onPress={exportDealersCSV}
              activeOpacity={0.85}
            >
              <Download size={15} color="#FFC700" />
              <Text style={[styles.exportSecondaryText, { color: colors.foreground }]}>Export Dealers Network CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Monthly Bid Volume Trend */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Monthly Bid Volume Trend</Text>
            <Text style={[styles.panelSub, { color: colors.mutedForeground, marginBottom: 14 }]}>
              Total bids across the last 6 months
            </Text>
            <SvgLineChart data={monthlyBidVolume} colors={colors} theme={theme} />

            <View style={{ gap: 8, marginTop: 14 }}>
              {monthlyBidVolume.filter(item => item.bids > 0).map((item, idx) => (
                <View key={idx} style={[styles.breakdownRow, { backgroundColor: isDark ? '#151824' : '#F7F8FB', borderColor: specBorder }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{item.month}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Gavel size={12} color="#FFC700" />
                    <Text style={styles.breakdownValue}>{item.bids} bids</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Monthly Inspection Submissions vs Approvals */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)' }]}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Monthly Inspection Submissions vs Approvals</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: '#94A3B8' }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Submitted</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Approved</Text>
              </View>
            </View>
            <SvgGroupedBarChart data={monthlyVehicleActivity} colors={colors} theme={theme} />

            <View style={{ gap: 8, marginTop: 14 }}>
              {monthlyVehicleActivity.map((item, idx) => (
                <View key={idx} style={[styles.breakdownRow, { backgroundColor: isDark ? '#151824' : '#F7F8FB', borderColor: specBorder }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{item.month}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Car size={11} color="#94A3B8" />
                      <Text style={[styles.breakdownSubValue, { color: colors.mutedForeground }]}>{item.Submitted} submitted</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CheckCircle2 size={11} color="#10B981" />
                      <Text style={[styles.breakdownSubValue, { color: colors.mutedForeground }]}>{item.Approved} approved</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1 },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  contentBody: { padding: 14, gap: 12, paddingBottom: 40 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12 },
  statIconWrapper: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  statValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: '800', marginTop: 3 },
  statDelta: { fontSize: 9.5, fontWeight: '600', marginTop: 3, opacity: 0.85 },

  // Export
  exportStack: { gap: 8, marginTop: 2 },
  exportPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#FFC700', borderRadius: 14, paddingVertical: 13,
    shadowColor: '#FFC700', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2,
  },
  exportPrimaryText: { color: '#0D0E12', fontSize: 12.5, fontWeight: '900' },
  exportSecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, borderWidth: 1, paddingVertical: 13,
  },
  exportSecondaryText: { fontSize: 12.5, fontWeight: '800' },

  // Panels
  panel: { borderRadius: 18, borderWidth: 1, padding: 14 },
  panelTitle: { fontSize: 13.5, fontWeight: '900', letterSpacing: -0.3 },
  panelSub: { fontSize: 10.5, fontWeight: '600', marginTop: 2 },

  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '700' },

  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
  },
  breakdownLabel: { fontSize: 12, fontWeight: '800' },
  breakdownValue: { fontSize: 12, fontWeight: '900', color: '#FFC700' },
  breakdownSubValue: { fontSize: 10.5, fontWeight: '700' },
});