import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Car,
  User,
  BadgeIndianRupee,
  ShieldCheck,
  CalendarDays,
  FileText, Download, Eye, UserCheck, Filter,
  Gavel,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

// Ported from web: src/lib/utils.ts — formats submittedAt the same way as web
function parseDateStringToLocal(inputStr: string): Date | null {
  const trimmed = inputStr.trim();
  if (!trimmed) return null;
  // ISO format without explicit Z or offset: e.g. "2026-08-11T17:20:15.166002"
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
    if (!trimmed) return 'N/A';
    const parsed = parseDateStringToLocal(trimmed);
    if (parsed && !isNaN(parsed.getTime())) return formatParsedDate(parsed);
    return trimmed;
  }
  return 'N/A';
}

interface AdminVehiclesScreenProps {
  navigation: any;
  route?: any;
  onOpenMenu: () => void;
}

export const AdminVehiclesScreen: React.FC<AdminVehiclesScreenProps> = ({ navigation, route, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspections, setInspections] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>((route?.params as any)?.inspector || '');

  const isDark = theme === 'dark';

  const inspectorOptions = Array.from(
    new Set(inspections.map((i) => (i.inspectorName || i.inspector)).filter((name): name is string => Boolean(name && String(name).trim())))
  ).sort();

  const fetchInspections = async () => {
    try {
      const res = await adminService.getSubmittedInspections();
      const rawList = Array.isArray(res) ? res : (res?.data || res?.inspections || []);
      if (Array.isArray(rawList)) {
        setInspections(rawList);
      }
    } catch (err: any) {
      console.error('Failed to load vehicle inspections list', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchInspections(); };

  const handleApprove = async (id: number, brand: string, model: string) => {
    setActionLoading(true);
    try {
      const res = await adminService.approveInspection(id);
      if (res.success) {
        showToast({ message: `${brand} ${model} approved for live bidding!`, type: 'success' });
        fetchInspections();
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to approve inspection.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast({ message: 'Please enter a rejection reason.', type: 'warning' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminService.rejectInspection(selectedInspection.inspectionId, rejectionReason.trim());
      if (res.success) {
        showToast({ message: 'Inspection rejected successfully.', type: 'success' });
        setRejectModalVisible(false);
        setSelectedInspection(null);
        setRejectionReason('');
        fetchInspections();
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to reject inspection.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

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

  const getStatusCount = (status: string) => {
    let list = inspections;
    if (selectedInspector) {
      list = list.filter((v) => (v.inspectorName || v.inspector || '').trim().toLowerCase() === selectedInspector.trim().toLowerCase());
    }
    if (status === 'All') return list.length;
    return list.filter((v) => (v.status || '').toUpperCase() === status.toUpperCase()).length;
  };

  const filteredInspections = inspections.filter((ins) => {
    // Inspector filter
    if (selectedInspector) {
      const insName = (ins.inspectorName || ins.inspector || '').trim().toLowerCase();
      if (insName !== selectedInspector.trim().toLowerCase()) {
        return false;
      }
    }
    // Status filter
    if (statusFilter !== 'All' && (ins.status || '').toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    // Search filter — matches brand, model, variant, vehicleNumber, ownerName, inspectorName
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = [
        ins.brand || '',
        ins.model || '',
        ins.variant || '',
        ins.vehicleNumber || '',
        ins.ownerName || '',
        ins.inspectorName || ins.inspector || '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  const getStatusMeta = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') return { bg: 'rgba(16,185,129,0.13)', text: '#10B981', border: 'rgba(16,185,129,0.25)', stripe: '#10B981' };
    if (s === 'REJECTED') return { bg: 'rgba(244,63,94,0.13)', text: '#F43F5E', border: 'rgba(244,63,94,0.25)', stripe: '#F43F5E' };
    if (s === 'SUBMITTED') return { bg: 'rgba(245,158,11,0.13)', text: '#F59E0B', border: 'rgba(245,158,11,0.25)', stripe: '#FFC700' };
    return { bg: 'rgba(148,163,184,0.13)', text: '#94A3B8', border: 'rgba(148,163,184,0.25)', stripe: '#94A3B8' };
  };

  const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

  // Theme-aware card layer colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const cardHeaderBg = isDark ? '#1A1D28' : '#EEF0F6';
  const specPanelBg  = isDark ? '#0F111A' : '#E8EBF3';
  const specBorder   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(100,110,140,0.15)';
  const footerBg     = isDark ? '#0D0E14' : '#F2F4FA';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Gavel size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Vehicles</Text>
        </View>
        <View style={styles.headerRightActions}>
          <AdminNotificationsModal />
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inspector Filter Row */}
      {inspectorOptions.length > 0 && (
        <View style={[styles.filterBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF', paddingTop: 8, paddingBottom: 4 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setSelectedInspector(null)}
              style={[
                styles.filterTab,
                !selectedInspector
                  ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                  : { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <UserCheck size={11} color={!selectedInspector ? '#0D0E12' : colors.mutedForeground} style={{ marginRight: 4 }} />
              <Text style={[styles.filterLabel, { color: !selectedInspector ? '#0D0E12' : colors.mutedForeground }]}>
                All Inspectors ({inspections.length})
              </Text>
            </TouchableOpacity>

            {inspectorOptions.map((name) => {
              const active = selectedInspector === name;
              const count = inspections.filter((i) => i.inspectorName === name).length;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => setSelectedInspector(name)}
                  style={[
                    styles.filterTab,
                    active
                      ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                      : { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <UserCheck size={11} color={active ? '#0D0E12' : colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={[styles.filterLabel, { color: active ? '#0D0E12' : colors.mutedForeground }]}>
                    {name}
                  </Text>
                  <View style={[styles.filterCount, { backgroundColor: active ? 'rgba(0,0,0,0.15)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
                    <Text style={[styles.filterCountText, { color: active ? '#0D0E12' : colors.mutedForeground }]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'Submitted', 'Approved', 'Rejected'].map((status) => {
            const active = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.filterTab,
                  active
                    ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                    : { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterLabel, { color: active ? '#0D0E12' : colors.mutedForeground }]}>
                  {status}
                </Text>
                <View style={[styles.filterCount, { backgroundColor: active ? 'rgba(0,0,0,0.15)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
                  <Text style={[styles.filterCountText, { color: active ? '#0D0E12' : colors.mutedForeground }]}>
                    {getStatusCount(status)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0D0E12' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by vehicle, owner, inspector..."
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
        {searchQuery.length > 0 && (
          <Text style={[styles.searchResultCount, { color: colors.mutedForeground }]}>
            {filteredInspections.length} result{filteredInspections.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFC700" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading vehicles inventory...</Text>
        </View>
      ) : filteredInspections.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
        >
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' }]}>
            <AlertTriangle size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Inspections Found</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            No vehicle inspections matching the "{statusFilter}" filter.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
          {filteredInspections.map((v, idx) => {
            const meta = getStatusMeta(v.status || 'DRAFT');
            const dateStr = formatIndianDateTime(v.submittedAt);
            const isActionable = (v.status || '').toUpperCase() === 'SUBMITTED';
            // Sequential front-end display ID (matches web: cell: (_, idx) => `#${idx}`)
            const displayId = idx + 1;

            return (
              <View
                key={v.inspectionId}
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBg,
                    borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)',
                    elevation: isDark ? 4 : 3,
                    shadowColor: isDark ? meta.stripe : '#8090B0',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.25 : 0.12,
                    shadowRadius: 10,
                  },
                ]}
              >
                {/* Sidebar-style ambient glow circles */}
                <View style={[styles.cardGlowTop, { backgroundColor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.10)' }]} />
                <View style={[styles.cardGlowBottom, { backgroundColor: isDark ? 'rgba(255,199,0,0.04)' : 'rgba(255,199,0,0.07)' }]} />

                {/* Colored left border accent */}
                <View style={[styles.leftAccent, { backgroundColor: meta.stripe }]} />

                {/* Card Header Section — tinted bg */}
                <View style={[styles.cardHeader, { backgroundColor: cardHeaderBg }]}>
                  <View style={styles.idRow}>
                    <View style={styles.idPill}>
                      <Car size={10} color="#FFC700" />
                      <Text style={styles.idPillText}>#{idx + 1}</Text>
                    </View>
                    {v.year && (
                      <View style={[styles.tagPill, { backgroundColor: isDark ? '#0F111A' : '#E8EBF0' }]}>
                        <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{v.year}</Text>
                      </View>
                    )}
                    {v.fuel && (
                      <View style={[styles.tagPill, { backgroundColor: isDark ? '#0F111A' : '#E8EBF0' }]}>
                        <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{v.fuel}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                    <View style={[styles.statusDot, { backgroundColor: meta.stripe }]} />
                    <Text style={[styles.statusText, { color: meta.text }]}>{(v.status || 'DRAFT').toUpperCase()}</Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text style={[styles.vehicleName, { color: colors.foreground }]}>
                    {v.brand} {v.model} {v.variant}
                  </Text>
                  <View style={styles.regRow}>
                    <View style={[styles.regPill, { borderColor: meta.border }]}>
                      <Text style={[styles.regPillText, { color: meta.text }]}>{v.vehicleNumber || '—'}</Text>
                    </View>
                  </View>

                  {/* Spec Panel - tinted background block */}
                  <View style={[styles.specPanel, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                    <View style={styles.specRow}>
                      <View style={styles.specCell}>
                        <View style={styles.specIcon}>
                          <User size={9} color="#FFC700" />
                        </View>
                        <View>
                          <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>OWNER</Text>
                          <Text style={[styles.specVal, { color: colors.foreground }]}>{v.ownerName || '1st Owner'}</Text>
                        </View>
                      </View>
                      <View style={[styles.specDivider, { backgroundColor: specBorder }]} />
                      <View style={styles.specCell}>
                        <View style={[styles.specIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                          <BadgeIndianRupee size={9} color="#10B981" />
                        </View>
                        <View>
                          <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>PRICE</Text>
                          <Text style={[styles.specVal, { color: '#10B981' }]}>{v.suggestedPrice ? inr(v.suggestedPrice) : 'N/A'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.specHDivider, { backgroundColor: specBorder }]} />

                    {/* Inspector — full width */}
                    <View style={styles.specCell}>
                      <View style={styles.specIcon}>
                        <ShieldCheck size={9} color="#FFC700" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>INSPECTOR</Text>
                        <Text style={[styles.specVal, { color: colors.foreground }]} numberOfLines={1}>{v.inspectorName || 'Field Inspector'}</Text>
                      </View>
                    </View>

                    <View style={[styles.specHDivider, { backgroundColor: specBorder }]} />

                    {/* Submitted — full width to avoid time text overflow */}
                    <View style={styles.specCell}>
                      <View style={styles.specIcon}>
                        <CalendarDays size={9} color="#FFC700" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>SUBMITTED ON</Text>
                        <Text style={[styles.specVal, { color: colors.foreground }]}>{dateStr}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Rejection reason */}
                  {(v.status || '').toUpperCase() === 'REJECTED' && v.rejectionReason && (
                    <View style={styles.rejectionBox}>
                      <View style={styles.rejectionHeader}>
                        <AlertTriangle size={11} color="#F43F5E" />
                        <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                      </View>
                      <Text style={styles.rejectionText}>{v.rejectionReason}</Text>
                    </View>
                  )}
                </View>

                {/* Footer Action Bar — distinct bg */}
                <View style={[styles.cardFooter, { backgroundColor: footerBg, borderTopColor: specBorder }]}>
                  {isActionable && (
                    <>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(v.inspectionId, v.brand, v.model)}
                        disabled={actionLoading}
                        activeOpacity={0.75}
                      >
                        <CheckCircle2 size={13} color="#0D0E12" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => { setSelectedInspection(v); setRejectModalVisible(true); }}
                        disabled={actionLoading}
                        activeOpacity={0.75}
                      >
                        <X size={13} color="#F43F5E" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                                    <TouchableOpacity
                    style={[styles.pdfBtn, { backgroundColor: isDark ? '#1A1D28' : '#E8EBF0', marginRight: 6 }]}
                    onPress={() => navigation.navigate('AdminVehicleDetail', { inspectionId: v.inspectionId, id: v.inspectionId, vehicleId: v.inspectionId })}
                    activeOpacity={0.75}
                  >
                    <Eye size={13} color="#FFC700" />
                    <Text style={styles.pdfBtnText}>Details</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }} />

                  {(v.status || '').toUpperCase() !== 'DRAFT' && (
                    <TouchableOpacity
                      style={[styles.pdfBtn, { backgroundColor: isDark ? '#1A1D28' : '#E8EBF0' }]}
                      onPress={() => handleDownloadPdf(v.inspectionId)}
                      activeOpacity={0.75}
                    >
                      <FileText size={13} color="#FFC700" />
                      <Text style={styles.pdfBtnText}>PDF</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Reject Inspection</Text>
            {selectedInspection && (
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                {selectedInspection.brand} {selectedInspection.model} ({selectedInspection.vehicleNumber})
              </Text>
            )}

            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F4F5F8' }]}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.mutedForeground}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setRejectModalVisible(false); setSelectedInspection(null); setRejectionReason(''); }}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleReject}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitText}>{actionLoading ? 'Saving...' : 'Confirm Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ── Header ──────────────────────────────────────────────
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerIconBtn: { padding: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // ── Filter Bar ──────────────────────────────────────────
  filterBar: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterCount: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '900',
  },

  // ── Loading / Empty ─────────────────────────────────────
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  searchContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  searchResultCount: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  listContainer: {
    padding: 14,
    gap: 16,
  },

  // ── Vehicle Card ─────────────────────────────────────────
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 10,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingLeft: 20,
    paddingVertical: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,199,0,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFC700',
  },
  tagPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Card Body
  cardBody: {
    paddingHorizontal: 16,
    paddingLeft: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  regRow: {
    marginTop: 3,
    marginBottom: 8,
  },
  regPill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,199,0,0.07)',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  regPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Spec Panel
  specPanel: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  specIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255,199,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  specVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 0,
  },
  specDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  specHDivider: {
    height: 1,
  },

  // Rejection
  rejectionBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderColor: 'rgba(244,63,94,0.22)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  rejectionTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#F43F5E',
    letterSpacing: 0.3,
  },
  rejectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F43F5E',
    lineHeight: 16,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingLeft: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  // Glow circles (same as sidebar)
  cardGlowTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 0,
  },
  cardGlowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    zIndex: 0,
  },
  approveBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  approveBtnText: {
    color: '#0D0E12',
    fontSize: 11,
    fontWeight: '900',
  },
  rejectBtn: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderColor: 'rgba(244,63,94,0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rejectBtnText: {
    color: '#F43F5E',
    fontSize: 11,
    fontWeight: '900',
  },
  pdfBtn: {
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pdfBtnText: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '900',
  },

  // ── Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 12,
    fontWeight: '600',
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalSubmitBtn: {
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
