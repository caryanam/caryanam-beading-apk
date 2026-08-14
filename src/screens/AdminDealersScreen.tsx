import React, { useState, useEffect, useMemo } from 'react';
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
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Gavel,
  Trash2,
  Crown,
  Trophy,
  Building2,
  Shield,
  Search,
  X,
  Upload,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

// ── Helpers ──────────────────────────────────────────────

const inr = (val: number) => '₹' + val.toLocaleString('en-IN');

interface DealerWonBid {
  vehicleId: number;
  vehicleNumber: string;
  brand: string;
  model: string;
  variant: string;
  winningBidAmount: number;
  status?: string;
}

// ── Component ────────────────────────────────────────────

interface AdminDealersScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const AdminDealersScreen: React.FC<AdminDealersScreenProps> = ({ onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected dealer modal state
  const [selectedDealer, setSelectedDealer] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  // ── Data Fetching ──────────────────────────────────────

  const fetchDealers = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const res = await adminService.getRegisteredDealers();
      if (res.success && res.data) {
        setDealers(res.data);
        if (showMsg) showToast({ message: 'Dealers list refreshed', type: 'success' });
      }
    } catch {
      // silent fetch error log
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDealers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onRefresh = () => fetchDealers(true);

  // ── Search & Filter ────────────────────────────────────

  const filteredDealers = useMemo(() => {
    if (!searchQuery.trim()) return dealers;
    const q = searchQuery.toLowerCase();
    return dealers.filter((d) =>
      [
        d.dealershipName || '',
        d.ownerName || '',
        d.email || '',
        d.mobileNumber || '',
        d.city || '',
      ].join(' ').toLowerCase().includes(q),
    );
  }, [dealers, searchQuery]);

  // ── Actions ────────────────────────────────────────────

  const openManageModal = (dealer: any) => {
    setSelectedDealer(dealer);
  };

  const handleImportExcel = async () => {
    try {
      const picked = await pick({
        type: [types.xlsx, types.xls, types.csv],
        allowMultiSelection: false,
      });
      const file = picked[0];
      if (!file) return;

      setImporting(true);
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'dealers-import.xlsx',
        type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as any);

      const res = await adminService.importDealersExcel(formData);
      if (res.success) {
        showToast({ message: 'Dealers imported successfully.', type: 'success' });
        fetchDealers();
      } else {
        showToast({ message: res.message || 'Import failed. Check the file format.', type: 'error' });
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      showToast({ message: 'Import failed. Please try again.', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteDealer = async () => {
    if (!selectedDealer) return;
    setDeleting(true);
    try {
      const res = await adminService.deleteAdminDealer(selectedDealer.id);
      if (res.success) {
        showToast({ message: 'Dealer account removed.', type: 'success' });
        setSelectedDealer(null);
        setShowDeleteConfirm(false);
        fetchDealers();
      } else {
        showToast({ message: res.message || 'Failed to delete dealer.', type: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to delete dealer.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const wonBids: DealerWonBid[] = selectedDealer?.wonBids || [];

  // Theme-aware card colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const cardHeaderBg = isDark ? '#1A1D28' : '#EEF0F6';
  const specPanelBg  = isDark ? '#0F111A' : '#E8EBF3';
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
          <Store size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dealers</Text>
          {dealers.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{dealers.length}</Text>
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

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0D0E12' : '#FFFFFF', borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
          <Search size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search dealers by shop name, owner, city..."
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
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading dealers...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >

          {/* Import Excel / CSV Quick Action */}
          <TouchableOpacity
            style={[styles.importBtn, importing && styles.importBtnDisabled]}
            onPress={handleImportExcel}
            disabled={importing}
            activeOpacity={0.85}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#0D0E12" />
            ) : (
              <Upload size={15} color="#0D0E12" />
            )}
            <Text style={styles.importBtnText}>{importing ? 'Importing...' : 'Import Excel / CSV'}</Text>
          </TouchableOpacity>

          {filteredDealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Store size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Dealers Found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {searchQuery.trim()
                  ? `No dealer matches "${searchQuery}"`
                  : 'No registered dealers available yet.'}
              </Text>
            </View>
          ) : (
            filteredDealers.map((d) => {
              const bidsCount = d.totalBids ?? 0;
              const wonCount = d.wonBidsCount ?? d.wonBids?.length ?? 0;
              return (
                <View
                  key={d.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: cardBg,
                      borderColor: isDark ? colors.border : 'rgba(100,110,150,0.18)',
                    },
                  ]}
                >
                  {/* Glow circles */}
                  <View style={[styles.cardGlowTop, { backgroundColor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.10)' }]} />
                  <View style={[styles.cardGlowBottom, { backgroundColor: isDark ? 'rgba(255,199,0,0.04)' : 'rgba(255,199,0,0.07)' }]} />

                  {/* Card Header */}
                  <View style={[styles.cardHeader, { backgroundColor: cardHeaderBg }]}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.storeIconWrap}>
                        <Store size={16} color="#FFC700" />
                      </View>
                      <Text style={[styles.dealershipName, { color: colors.foreground }]} numberOfLines={1}>
                        {d.dealershipName}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.manageBtn} onPress={() => openManageModal(d)} activeOpacity={0.75}>
                      <Text style={styles.manageBtnText}>Manage</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <User size={12} color={colors.mutedForeground} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Owner:</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{d.ownerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Mail size={12} color={colors.mutedForeground} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email:</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{d.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Phone size={12} color={colors.mutedForeground} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Mobile:</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{d.mobileNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MapPin size={12} color={colors.mutedForeground} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>City:</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                        {d.city || 'N/A'}{d.area ? ` (${d.area})` : ''}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Store size={12} color={colors.mutedForeground} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Address:</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                        {d.address || 'N/A'}
                      </Text>
                    </View>

                    {/* Bids & Won Badges */}
                    <View style={styles.badgeRow}>
                      <View style={styles.bidsBadge}>
                        <Gavel size={11} color="#FFC700" />
                        <Text style={styles.bidsBadgeText}>{bidsCount} Bids</Text>
                      </View>
                      <View style={styles.wonBadge}>
                        <Trophy size={11} color="#10B981" />
                        <Text style={styles.wonBadgeText}>{wonCount} Won</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Dealer Management Details Modal */}
      <Modal visible={!!selectedDealer} transparent animationType="fade" onRequestClose={() => setSelectedDealer(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Sticky Header */}
            <View style={[styles.modalHeader, { borderBottomColor: specBorder }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.buildingIconWrap}>
                  <Building2 size={22} color="#FFC700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {selectedDealer?.dealershipName}
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                    ID #{selectedDealer?.id} · Registered Partner Dealer
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={() => setSelectedDealer(null)} activeOpacity={0.7}>
                <X size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Body */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>

              {/* 3 Summary Stat Cards */}
              <View style={styles.statRow}>
                <View style={[styles.statCard, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TOTAL ACTIVE BIDS</Text>
                  <View style={styles.statValueRow}>
                    <Gavel size={14} color="#FFC700" />
                    <Text style={[styles.statValue, { color: '#FFC700' }]}>{selectedDealer?.totalBids ?? 0}</Text>
                  </View>
                  <Text style={[styles.statCaption, { color: colors.mutedForeground }]}>Bids Placed</Text>
                </View>

                <View style={[styles.statCard, styles.statCardWon, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={[styles.statLabel, { color: '#10B981' }]}>AUCTIONS WON</Text>
                  <View style={styles.statValueRow}>
                    <Trophy size={14} color="#10B981" />
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      {selectedDealer?.wonBidsCount ?? selectedDealer?.wonBids?.length ?? 0}
                    </Text>
                  </View>
                  <Text style={[styles.statCaption, { color: '#10B981' }]}>Won Bids</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ACCOUNT STATUS</Text>
                  <View style={styles.statValueRow}>
                    <Shield size={14} color="#10B981" />
                    <Text style={[styles.statValue, { color: '#10B981' }]}>Verified</Text>
                  </View>
                  <Text style={[styles.statCaption, { color: colors.mutedForeground }]}>Active Account</Text>
                </View>
              </View>

              {/* Dealer Details Card */}
              <View style={[styles.detailCard, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                <View style={[styles.detailCardHeader, { borderBottomColor: specBorder }]}>
                  <User size={14} color="#FFC700" />
                  <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>DEALER INFORMATION OVERVIEW</Text>
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailCell}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Owner Full Name</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedDealer?.ownerName}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Email Address</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedDealer?.email}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Mobile Contact</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedDealer?.mobileNumber}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>City & Area</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {selectedDealer?.city || 'N/A'}{selectedDealer?.area ? ` (${selectedDealer.area})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailAddressBlock, { borderTopColor: specBorder }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Full Address</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {selectedDealer?.address || 'No address details provided.'}
                  </Text>
                </View>
              </View>

              {/* Won Bids History & Details Section */}
              <View style={[styles.wonCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={[styles.wonCardHeader, { borderBottomColor: specBorder }]}>
                  <Crown size={14} color="#FFC700" />
                  <Text style={[styles.wonCardTitle, { color: colors.foreground }]}>
                    WON AUCTIONS & BIDS LOG ({wonBids.length})
                  </Text>
                </View>

                {wonBids.length === 0 ? (
                  <View style={[styles.wonEmpty, { borderColor: colors.border }]}>
                    <Trophy size={26} color={colors.mutedForeground} />
                    <Text style={[styles.wonEmptyText, { color: colors.mutedForeground }]}>
                      No won auction records for this dealer yet.
                    </Text>
                  </View>
                ) : (
                  wonBids.map((won, idx) => (
                    <View key={won.vehicleId || idx} style={styles.wonRow}>
                      <View style={styles.wonRowLeft}>
                        <View style={styles.wonCrownBadge}>
                          <Crown size={14} color="#0D0E12" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.wonVehicleTopRow}>
                            <View style={styles.wonVehiclePill}>
                              <Text style={styles.wonVehicleText}>{won.vehicleNumber}</Text>
                            </View>
                          </View>
                          <Text style={[styles.wonVehicleName, { color: colors.foreground }]} numberOfLines={1}>
                            {won.brand} {won.model} {won.variant}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.wonAmountBlock}>
                        <Text style={styles.wonAmount}>{inr(won.winningBidAmount || 0)}</Text>
                        <Text style={[styles.wonAmountLabel, { color: colors.mutedForeground }]}>Winning Bid</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {/* Sticky Footer Controls */}
            <View style={[styles.modalFooter, { borderTopColor: specBorder }]}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Trash2 size={15} color="#F43F5E" />
                <Text style={styles.deleteBtnText}>Delete Dealer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeWindowBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => setSelectedDealer(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.closeWindowText, { color: colors.foreground }]}>Close Window</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.confirmIconRow}>
              <View style={styles.confirmDangerIcon}>
                <Trash2 size={24} color="#F43F5E" />
              </View>
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Delete Dealer Account</Text>
            <Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>
              Are you sure you want to permanently delete dealership{' '}
              <Text style={{ fontWeight: '900', color: colors.foreground }}>"{selectedDealer?.dealershipName}"</Text>? This action cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteDealer}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Trash2 size={13} color="#FFFFFF" />
                <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting...' : 'Delete Dealer'}</Text>
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
  countBadge: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  countBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFC700' },

  // Search
  searchContainer: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', padding: 0 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  listContainer: { padding: 14, gap: 12, paddingBottom: 40 },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#FFC700', borderRadius: 14,
    paddingVertical: 13,
    shadowColor: '#FFC700', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2,
  },
  importBtnText: { color: '#0D0E12', fontSize: 12.5, fontWeight: '900' },
  importBtnDisabled: { opacity: 0.55 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Dealer Card
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardGlowTop: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, zIndex: 0 },
  cardGlowBottom: { position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: 75, zIndex: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 8 },
  storeIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  dealershipName: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.3 },
  manageBtn: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.25)', paddingHorizontal: 12, paddingVertical: 7,
  },
  manageBtnText: { color: '#FFC700', fontSize: 10.5, fontWeight: '900' },

  cardBody: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoLabel: { fontSize: 11, fontWeight: '800', width: 58 },
  infoValue: { fontSize: 12, fontWeight: '600', flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bidsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,199,0,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  bidsBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFC700' },
  wonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  wonBadgeText: { fontSize: 10, fontWeight: '900', color: '#10B981' },

  // Manage Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 16 },
  modalCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', maxHeight: '92%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  buildingIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 16, gap: 14 },

  // Stat Cards
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 11 },
  statCardWon: { backgroundColor: 'rgba(16,185,129,0.05)' },
  statLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  statValue: { fontSize: 15, fontWeight: '900' },
  statCaption: { fontSize: 8, fontWeight: '600', marginTop: 2 },

  // Details Card
  detailCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1 },
  detailCardTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 13, paddingTop: 11, rowGap: 12 },
  detailCell: { width: '50%', paddingRight: 8 },
  detailLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 12, fontWeight: '800' },
  detailAddressBlock: { paddingHorizontal: 13, paddingVertical: 12, borderTopWidth: 1, marginTop: 12 },

  // Won Bids Card
  wonCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  wonCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1 },
  wonCardTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  wonEmpty: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', padding: 22, alignItems: 'center', gap: 8, margin: 12 },
  wonEmptyText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  wonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 12, padding: 11, marginHorizontal: 12, marginTop: 8,
  },
  wonRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 8 },
  wonCrownBadge: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: '#FFC700', justifyContent: 'center', alignItems: 'center',
  },
  wonVehicleTopRow: { flexDirection: 'row', alignItems: 'center' },
  wonVehiclePill: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  wonVehicleText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  wonVehicleName: { fontSize: 11.5, fontWeight: '900', marginTop: 4 },
  wonAmountBlock: { alignItems: 'flex-end' },
  wonAmount: { fontSize: 14, fontWeight: '900', color: '#10B981' },
  wonAmountLabel: { fontSize: 8.5, fontWeight: '700', marginTop: 1 },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  deleteBtnText: { color: '#F43F5E', fontSize: 11, fontWeight: '900' },
  closeWindowBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  closeWindowText: { fontSize: 11, fontWeight: '800' },

  // Confirm Modal
  confirmModal: { borderWidth: 1, borderRadius: 22, padding: 22 },
  confirmIconRow: { alignItems: 'center', marginBottom: 14 },
  confirmDangerIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244,63,94,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  confirmTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  confirmDesc: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18 },
  confirmCancelBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  confirmCancelText: { fontSize: 12, fontWeight: '800' },
  confirmDeleteBtn: {
    backgroundColor: '#F43F5E', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  confirmDeleteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
