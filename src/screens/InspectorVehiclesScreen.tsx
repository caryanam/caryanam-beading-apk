import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  RefreshCw,
  Eye,
  Edit3,
  Download,
  Trash2,
  Search,
  X,
  Car,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { inspectorService } from '../services/inspectorService';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface InspectorVehiclesScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Not Submitted';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusMeta = (s: string) => {
  const status = (s || '').toUpperCase();
  if (status === 'APPROVED') {
    return { text: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2 };
  }
  if (status === 'REJECTED') {
    return { text: 'Rejected', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', icon: XCircle };
  }
  if (status === 'SUBMITTED') {
    return { text: 'Submitted', color: '#FFC700', bg: 'rgba(255,199,0,0.12)', icon: Clock3 };
  }
  return { text: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: FileText };
};

export const InspectorVehiclesScreen: React.FC<InspectorVehiclesScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const fetchInspections = useCallback(async () => {
    try {
      const res = await inspectorService.getMyInspections();
      const rawList = Array.isArray(res) ? res : (res?.data || res?.inspections || []);
      if (Array.isArray(rawList)) {
        const processed = rawList.map((item: any) => ({
          ...item,
          ownerName: item.ownerName || '1st Owner',
          vehicleName: `${item.brand || ''} ${item.model || ''} ${item.variant || ''}`.trim(),
        }));
        const sorted = [...processed].sort((a: any, b: any) => (b.inspectionId || b.id || 0) - (a.inspectionId || a.id || 0));
        setInspections(sorted);
      }
    } catch (err: any) {
      console.error('Failed to load inspections list', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspections();
  };

  const getStatusCount = (status: string) => {
    if (status === 'All') return inspections.length;
    if (status === 'Draft') {
      return inspections.filter((v) => v.status === 'DRAFT' || v.status === 'IN_PROGRESS').length;
    }
    return inspections.filter((v) => (v.status || '').toUpperCase() === status.toUpperCase()).length;
  };

  const filtered = inspections.filter((v) => {
    const s = (v.status || '').toUpperCase();
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Draft' ? s === 'DRAFT' || s === 'IN_PROGRESS' : s === statusFilter.toUpperCase());
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      `${v.brand} ${v.model} ${v.variant}`.toLowerCase().includes(q) ||
      (v.vehicleNumber || '').toLowerCase().includes(q) ||
      (v.ownerName || '').toLowerCase().includes(q)
    );
  });

  const handleDownloadPdf = async (id: number) => {
    setDownloadingId(id);
    try {
      await inspectorService.downloadPdf(id);
    } catch {
      // silent download
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await inspectorService.deleteDraft(deleteTarget.inspectionId);
      if (res.success) {
        showToast({ message: 'Inspection draft deleted successfully.', type: 'success' });
        setDeleteTarget(null);
        fetchInspections();
      }
    } catch (err: any) {
      showToast({ message: err?.response?.data?.message || 'Failed to delete draft.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const filterChips = ['All', 'Draft', 'Submitted', 'Approved', 'Rejected'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Car size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Vehicles</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
          <RefreshCw size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={[styles.filterBar, { backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {filterChips.map((status) => {
            const active = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                    : { backgroundColor: cardBg, borderColor: colors.border },
                ]}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, { color: active ? '#0D0E12' : colors.foreground }]}>{status}</Text>
                <View style={[styles.filterCountPill, { backgroundColor: active ? 'rgba(13,14,18,0.15)' : 'rgba(148,163,184,0.15)' }]}>
                  <Text style={[styles.filterCountText, { color: active ? '#0D0E12' : colors.mutedForeground }]}>
                    {getStatusCount(status)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <Search size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search vehicle, reg no or owner..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
      >
        <View style={styles.contentBody}>
          {loading ? (
            <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyView, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <Car size={34} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {inspections.length === 0 ? 'No inspections created yet.' : 'No vehicles match your filters.'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {inspections.length === 0
                  ? 'Tap "Add Vehicle" in the menu to start a new inspection report.'
                  : 'Try changing the status filter or search query.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((v, index) => {
                const s = (v.status || '').toUpperCase();
                const canEdit = s !== 'APPROVED';
                const canDelete = s === 'DRAFT' || s === 'REJECTED';
                const meta = statusMeta(s);

                return (
                  <View key={v.inspectionId} style={[styles.vehicleCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('InspectorVehicleDetail', { inspectionId: v.inspectionId })}
                      activeOpacity={0.85}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={styles.vehicleNameWrap}>
                          <Text style={[styles.vehicleName, { color: colors.foreground }]} numberOfLines={1}>
                            {v.vehicleName || `Inspection #${index + 1}`}
                          </Text>
                          <View style={[styles.idPill, { backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                            <Text style={[styles.idText, { color: colors.mutedForeground }]}>#{index + 1}</Text>
                          </View>
                        </View>
                        <View style={[styles.chip, { backgroundColor: meta.bg }]}>
                          <meta.icon size={10} color={meta.color} />
                          <Text style={[styles.chipText, { color: meta.color }]}>{meta.text}</Text>
                        </View>
                      </View>

                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Reg No</Text>
                        <Text style={[styles.specValue, { color: colors.foreground }]}>{v.vehicleNumber || 'N/A'}</Text>
                      </View>
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Owner</Text>
                        <Text style={[styles.specValue, { color: colors.foreground }]}>{v.ownerName || '1st Owner'}</Text>
                      </View>
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Suggested Price</Text>
                        <Text style={[styles.specValueGold, { color: '#FFC700' }]}>
                          {v.suggestedPrice ? inr(v.suggestedPrice) : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Submitted</Text>
                        <Text style={[styles.specValue, { color: colors.foreground }]}>{formatDate(v.submittedAt)}</Text>
                      </View>

                      {s === 'REJECTED' && v.rejectionReason ? (
                        <View style={styles.rejectReason}>
                          <AlertCircle size={11} color="#F43F5E" />
                          <Text style={[styles.rejectReasonText, { color: '#F43F5E' }]} numberOfLines={2}>
                            Reason: {v.rejectionReason}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>

                    {/* Actions */}
                    <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('InspectorVehicleDetail', { inspectionId: v.inspectionId })}
                        activeOpacity={0.8}
                      >
                        <Eye size={15} color={colors.foreground} />
                        <Text style={[styles.actionText, { color: colors.foreground }]}>View</Text>
                      </TouchableOpacity>

                      {canEdit && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => navigation.navigate('InspectorAddVehicle', { inspectionId: v.inspectionId })}
                          activeOpacity={0.8}
                        >
                          <Edit3 size={15} color="#FFC700" />
                          <Text style={[styles.actionText, { color: '#FFC700' }]}>
                            {s === 'REJECTED' ? 'Resubmit' : 'Edit'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.actionBtn}
                        disabled={downloadingId === v.inspectionId}
                        onPress={() => handleDownloadPdf(v.inspectionId)}
                        activeOpacity={0.8}
                      >
                        {downloadingId === v.inspectionId ? (
                          <ActivityIndicator size="small" color="#FFC700" />
                        ) : (
                          <Download size={15} color={colors.foreground} />
                        )}
                        <Text style={[styles.actionText, { color: colors.foreground }]}>PDF</Text>
                      </TouchableOpacity>

                      {canDelete && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setDeleteTarget(v)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={15} color="#F43F5E" />
                          <Text style={[styles.actionText, { color: '#F43F5E' }]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal transparent visible={deleteTarget !== null} animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
              <Trash2 size={20} color="#F43F5E" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Delete Inspection Draft</Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              Are you sure you want to delete this inspection draft? This action is permanent and cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}
                onPress={() => setDeleteTarget(null)}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, deleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete Draft</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerIconBtn: {
    padding: 8,
  },
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
  filterBar: {
    paddingTop: 12,
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '900',
  },
  filterCountPill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: '900',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  contentBody: {
    padding: 16,
    paddingTop: 4,
  },
  emptyView: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
  },
  listContainer: {
    gap: 14,
  },
  vehicleCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  vehicleNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  idPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idText: {
    fontSize: 9,
    fontWeight: '800',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  specLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  specValue: {
    fontSize: 11.5,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  specValueGold: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  rejectReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 6,
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  rejectReasonText: {
    fontSize: 9.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#F43F5E',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
