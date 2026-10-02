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
  Alert,
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
  Car,
  CheckCircle2,
  Check,
  TriangleAlert,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
  const [makingFreelancerId, setMakingFreelancerId] = useState<number | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Import summary modal state
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    issues: string[];
  } | null>(null);
  const [showImportSummaryModal, setShowImportSummaryModal] = useState(false);

  const handleMakeFreelancer = async (dealer: any) => {
    setMakingFreelancerId(dealer.id);
    try {
      const res = await adminService.makeDealerFreelancer(dealer.id);
      if (res.success) {
        showToast({ message: `${dealer.dealershipName || 'Dealer'} is now granted Freelancer access!`, type: 'success' });
        if (selectedDealer && selectedDealer.id === dealer.id) {
          setSelectedDealer((prev: any) => (prev ? { ...prev, isFreelancer: true } : null));
        }
        fetchDealers();
      } else {
        showToast({ message: res.message || 'Failed to make freelancer.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to grant freelancer access.', type: 'error' });
    } finally {
      setMakingFreelancerId(null);
    }
  };

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

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const totalPages = Math.max(1, Math.ceil(filteredDealers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredDealers.length);
  const paginatedDealers = useMemo(
    () => filteredDealers.slice(startIndex, endIndex),
    [filteredDealers, startIndex, endIndex]
  );

  const goToPage = (newPage: number) => {
    const target = Math.max(1, Math.min(totalPages, newPage));
    setPage(target);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

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
      if (res.data) {
        setImportSummary(res.data);
        setShowImportSummaryModal(true);
      }
      if (res.success && (!res.data || res.data.importedCount > 0)) {
        showToast({ message: res.message || 'Dealers imported successfully.', type: 'success' });
        fetchDealers();
      } else if (res.data && res.data.importedCount === 0) {
        showToast({ message: res.message || 'No dealers were imported. Check issue details.', type: 'error' });
      } else if (res.success) {
        showToast({ message: res.message || 'Dealers imported successfully.', type: 'success' });
        fetchDealers();
      } else {
        showToast({ message: res.message || 'Import failed. Check the file format.', type: 'error' });
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      showToast({ message: err?.response?.data?.message || err?.message || 'Import failed. Please try again.', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const canDeleteDealer = (d: any) => {
    if (!d) return false;
    const bids = d.totalBids ?? 0;
    const won = d.wonBidsCount ?? d.wonBids?.length ?? 0;
    return bids === 0 && won === 0;
  };

  const isAllSelected = filteredDealers.length > 0 && filteredDealers.every((d) => selectedIds.includes(d.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDealers.map((d) => d.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const selectedDealers = useMemo(
    () => dealers.filter((d) => selectedIds.includes(d.id)),
    [dealers, selectedIds]
  );
  const eligibleSelectedDealers = useMemo(
    () => selectedDealers.filter(canDeleteDealer),
    [selectedDealers]
  );
  const ineligibleSelectedDealers = useMemo(
    () => selectedDealers.filter((d) => !canDeleteDealer(d)),
    [selectedDealers]
  );

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await adminService.deleteMultipleDealers(selectedIds);
      if (res.success && res.data) {
        const { deletedCount, skippedCount } = res.data;
        if (deletedCount > 0) {
          showToast({ message: `${deletedCount} dealer(s) deleted successfully.`, type: 'success' });
        }
        if (skippedCount > 0) {
          showToast({
            message: `${skippedCount} dealer(s) were protected and skipped (have active bids or won auctions).`,
            type: 'info',
          });
        }
        if (deletedCount === 0 && skippedCount > 0) {
          showToast({
            message: `0 deleted. All ${skippedCount} selected dealer(s) have active bids or won auctions.`,
            type: 'error',
          });
        }
        setSelectedIds([]);
        setShowBulkDeleteConfirm(false);
        fetchDealers();
      } else {
        showToast({ message: res.message || 'Failed to delete selected dealers.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || err.message || 'Failed to delete dealers.', type: 'error' });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteDealer = async () => {
    const targetDealer = selectedDealer;
    if (!targetDealer) return;
    if (!canDeleteDealer(targetDealer)) {
      showToast({
        message: `Cannot delete: Dealer has ${targetDealer.totalBids ?? 0} bid(s) and ${targetDealer.wonBidsCount ?? targetDealer.wonBids?.length ?? 0} won. Only dealers with 0 bids and 0 won can be deleted.`,
        type: 'error',
      });
      setShowDeleteConfirm(false);
      return;
    }

    setDeleting(true);
    try {
      const res = await adminService.deleteAdminDealer(targetDealer.id);
      if (res.success) {
        showToast({ message: 'Dealer account removed.', type: 'success' });
        setSelectedIds((prev) => prev.filter((id) => id !== targetDealer.id));
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
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(1);
            }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setPage(1);
              }}
              activeOpacity={0.7}
            >
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
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.listContainer, selectedIds.length > 0 && { paddingBottom: 95 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >

          {/* Top Actions Row: Select All + Import Excel */}
          <View style={styles.topActionsRow}>
            {filteredDealers.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.selectAllBtn,
                  {
                    backgroundColor: isAllSelected ? 'rgba(255,199,0,0.18)' : isDark ? '#1A1D28' : '#F0F2F7',
                    borderColor: isAllSelected ? '#FFC700' : colors.border,
                  },
                ]}
                onPress={handleToggleSelectAll}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.checkboxSmall,
                    isAllSelected
                      ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                      : { borderColor: colors.mutedForeground, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                >
                  {isAllSelected && <Check size={11} color="#0D0E12" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.selectAllBtnText,
                    { color: isAllSelected ? '#FFC700' : colors.foreground },
                  ]}
                >
                  {isAllSelected ? 'Deselect All' : `Select All (${filteredDealers.length})`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.importBtn, importing && styles.importBtnDisabled]}
              onPress={handleImportExcel}
              disabled={importing}
              activeOpacity={0.85}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#0D0E12" />
              ) : (
                <Upload size={14} color="#0D0E12" strokeWidth={2.5} />
              )}
              <Text style={styles.importBtnText}>{importing ? 'Importing...' : 'Import Excel'}</Text>
            </TouchableOpacity>
          </View>

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
            paginatedDealers.map((d) => {
              const bidsCount = d.totalBids ?? 0;
              const wonCount = d.wonBidsCount ?? d.wonBids?.length ?? 0;
              const isSelected = selectedIds.includes(d.id);

              return (
                <View
                  key={d.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: cardBg,
                      borderColor: isSelected
                        ? '#FFC700'
                        : isDark
                        ? colors.border
                        : 'rgba(100,110,150,0.18)',
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Glow circles */}
                  <View style={[styles.cardGlowTop, { backgroundColor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.10)' }]} />
                  <View style={[styles.cardGlowBottom, { backgroundColor: isDark ? 'rgba(255,199,0,0.04)' : 'rgba(255,199,0,0.07)' }]} />

                  {/* Card Header with Checkbox */}
                  <View style={[styles.cardHeader, { backgroundColor: isSelected ? (isDark ? 'rgba(255,199,0,0.08)' : 'rgba(255,199,0,0.12)') : cardHeaderBg }]}>
                    <TouchableOpacity
                      style={styles.cardHeaderLeft}
                      onPress={() => handleToggleSelect(d.id)}
                      activeOpacity={0.75}
                    >
                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          isSelected
                            ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                            : { borderColor: colors.mutedForeground, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                        ]}
                      >
                        {isSelected && <Check size={13} color="#0D0E12" strokeWidth={3} />}
                      </View>

                      <View style={styles.storeIconWrap}>
                        <Store size={16} color="#FFC700" />
                      </View>
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <Text style={[styles.dealershipName, { color: colors.foreground }]} numberOfLines={1}>
                          {d.dealershipName}
                        </Text>
                        {d.isFreelancer && (
                          <View style={styles.dealerFreelancerTag}>
                            <Car size={9} color="#0284C7" />
                            <Text style={styles.dealerFreelancerTagText}>Freelancer</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {!d.isFreelancer && (
                        <TouchableOpacity
                          style={styles.makeFreelancerCardBtn}
                          onPress={() => handleMakeFreelancer(d)}
                          disabled={makingFreelancerId === d.id}
                          activeOpacity={0.75}
                        >
                          {makingFreelancerId === d.id ? (
                            <ActivityIndicator size="small" color="#0284C7" />
                          ) : (
                            <>
                              <Car size={11} color="#0284C7" />
                              <Text style={styles.makeFreelancerCardBtnText}>Make Freelancer</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.manageBtn} onPress={() => openManageModal(d)} activeOpacity={0.75}>
                        <Text style={styles.manageBtnText}>Manage</Text>
                      </TouchableOpacity>
                    </View>
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
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{d.email || 'N/A'}</Text>
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

          {/* Pagination Controls Card */}
          {filteredDealers.length > 0 && (
            <View style={[styles.paginationCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              {/* Info Row: Record counts + Page Size selector */}
              <View style={styles.paginationInfoRow}>
                <Text style={[styles.paginationCountText, { color: colors.mutedForeground }]}>
                  Showing <Text style={{ fontWeight: '900', color: colors.foreground }}>{startIndex + 1} - {endIndex}</Text> of{' '}
                  <Text style={{ fontWeight: '900', color: colors.foreground }}>{filteredDealers.length}</Text> dealers
                </Text>

                {/* Page Size Selector (10, 20, 50) */}
                <View style={styles.pageSizeRow}>
                  <Text style={[styles.pageSizeLabel, { color: colors.mutedForeground }]}>Per page:</Text>
                  {[10, 20, 50].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.pageSizeChip,
                        pageSize === size
                          ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                          : { borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' },
                      ]}
                      onPress={() => {
                        setPageSize(size);
                        setPage(1);
                        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.pageSizeChipText,
                          { color: pageSize === size ? '#0D0E12' : colors.foreground },
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Navigation Buttons Row */}
              {totalPages > 1 && (
                <View style={[styles.paginationNavRow, { borderTopColor: specBorder }]}>
                  <TouchableOpacity
                    style={[
                      styles.pageNavBtn,
                      { borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' },
                      currentPage === 1 && styles.pageNavBtnDisabled,
                    ]}
                    onPress={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    activeOpacity={0.75}
                  >
                    <ChevronLeft size={16} color={currentPage === 1 ? colors.mutedForeground : colors.foreground} />
                    <Text
                      style={[
                        styles.pageNavBtnText,
                        { color: currentPage === 1 ? colors.mutedForeground : colors.foreground },
                      ]}
                    >
                      Prev
                    </Text>
                  </TouchableOpacity>

                  {/* Page numbers or indicator */}
                  <View style={styles.pageNumbersRow}>
                    {totalPages <= 5 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        const isActive = p === currentPage;
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.pageNumBtn,
                              isActive
                                ? { backgroundColor: '#FFC700', borderColor: '#FFC700' }
                                : { borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' },
                            ]}
                            onPress={() => goToPage(p)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.pageNumText,
                                { color: isActive ? '#0D0E12' : colors.foreground },
                              ]}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={[styles.pageIndicatorPill, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>
                        <Text style={[styles.pageIndicatorText, { color: colors.foreground }]}>
                          Page <Text style={{ color: '#FFC700', fontWeight: '900' }}>{currentPage}</Text> of {totalPages}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.pageNavBtn,
                      { borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' },
                      currentPage === totalPages && styles.pageNavBtnDisabled,
                    ]}
                    onPress={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.pageNavBtnText,
                        { color: currentPage === totalPages ? colors.mutedForeground : colors.foreground },
                      ]}
                    >
                      Next
                    </Text>
                    <ChevronRight size={16} color={currentPage === totalPages ? colors.mutedForeground : colors.foreground} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
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

              {/* Freelancer Access Card */}
              <View style={[styles.modalFreelancerCard, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : '#F0F9FF', borderColor: 'rgba(56,189,248,0.3)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <View style={styles.modalFreelancerIcon}>
                      <Car size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalFreelancerTitle, { color: colors.foreground }]}>Freelancer Access</Text>
                      <Text style={[styles.modalFreelancerDesc, { color: colors.mutedForeground }]}>
                        {selectedDealer?.isFreelancer
                          ? 'Active: Dealer can log in as Freelancer & upload vehicle inspections.'
                          : 'Grant Freelancer role for uploading car inspections.'}
                      </Text>
                    </View>
                  </View>
                  {selectedDealer?.isFreelancer ? (
                    <View style={styles.freelancerActiveBadge}>
                      <CheckCircle2 size={12} color="#0284C7" />
                      <Text style={styles.freelancerActiveBadgeText}>Active</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalMakeFreelancerBtn}
                      onPress={() => handleMakeFreelancer(selectedDealer)}
                      disabled={makingFreelancerId === selectedDealer?.id}
                    >
                      {makingFreelancerId === selectedDealer?.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Car size={12} color="#FFFFFF" />
                          <Text style={styles.modalMakeFreelancerBtnText}>Make Freelancer</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

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
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedDealer?.email || 'N/A'}</Text>
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
              {canDeleteDealer(selectedDealer) ? (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  <Trash2 size={15} color="#F43F5E" />
                  <Text style={styles.deleteBtnText}>Delete Dealer</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.deleteBtn, { opacity: 0.5, borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <Trash2 size={15} color={colors.mutedForeground} />
                  <Text style={[styles.deleteBtnText, { color: colors.mutedForeground }]}>Delete (Locked: Has Bids/Won)</Text>
                </View>
              )}

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

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <View
          style={[
            styles.bulkActionBar,
            {
              backgroundColor: isDark ? '#12141C' : '#FFFFFF',
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.bulkActionLeft}>
            <View style={styles.bulkSelectedBadge}>
              <Text style={styles.bulkSelectedBadgeText}>{selectedIds.length}</Text>
            </View>
            <Text style={[styles.bulkSelectedText, { color: colors.foreground }]}>Selected</Text>
          </View>
          <View style={styles.bulkActionRight}>
            <TouchableOpacity
              style={[styles.bulkDeselectBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1A1D28' : '#F0F2F7' }]}
              onPress={handleDeselectAll}
              activeOpacity={0.75}
            >
              <Text style={[styles.bulkDeselectText, { color: colors.mutedForeground }]}>Deselect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkDeleteBtn}
              onPress={() => setShowBulkDeleteConfirm(true)}
              activeOpacity={0.85}
            >
              <Trash2 size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.bulkDeleteText}>Delete ({selectedIds.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

      {/* Bulk Delete Confirmation Modal */}
      <Modal visible={showBulkDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowBulkDeleteConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.bulkModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Header */}
            <View style={[styles.bulkModalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.bulkModalHeaderLeft}>
                <View style={styles.confirmDangerIcon}>
                  <Trash2 size={22} color="#F43F5E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bulkModalTitle, { color: colors.foreground }]}>Delete Selected Dealers</Text>
                  <Text style={[styles.bulkModalSub, { color: colors.mutedForeground }]}>
                    Rule: Only dealers with 0 bids and 0 won auctions can be deleted
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowBulkDeleteConfirm(false)}
                style={[styles.modalCloseBtn, { borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <X size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {/* 3 Summary Stats */}
              <View style={styles.bulkStatRow}>
                <View style={[styles.bulkStatCard, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                  <Text style={[styles.bulkStatLabel, { color: colors.mutedForeground }]}>SELECTED</Text>
                  <Text style={[styles.bulkStatValue, { color: colors.foreground }]}>{selectedIds.length}</Text>
                </View>

                <View style={[styles.bulkStatCard, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={[styles.bulkStatLabel, { color: '#10B981' }]}>ELIGIBLE (0 BIDS)</Text>
                  <Text style={[styles.bulkStatValue, { color: '#10B981' }]}>{eligibleSelectedDealers.length}</Text>
                </View>

                <View style={[styles.bulkStatCard, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                  <Text style={[styles.bulkStatLabel, { color: '#D97706' }]}>PROTECTED</Text>
                  <Text style={[styles.bulkStatValue, { color: '#D97706' }]}>{ineligibleSelectedDealers.length}</Text>
                </View>
              </View>

              {/* Ineligible / Protected Dealers warning box if any */}
              {ineligibleSelectedDealers.length > 0 && (
                <View style={styles.protectedBox}>
                  <View style={styles.protectedHeaderRow}>
                    <TriangleAlert size={14} color="#D97706" />
                    <Text style={styles.protectedHeaderText}>
                      Protected Dealers ({ineligibleSelectedDealers.length}) — Will NOT be deleted:
                    </Text>
                  </View>
                  <View style={[styles.protectedListWrap, { borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.05)' }]}>
                    {ineligibleSelectedDealers.map((d) => (
                      <View key={d.id} style={styles.protectedItemRow}>
                        <Text style={[styles.protectedItemName, { color: colors.foreground }]} numberOfLines={1}>
                          {d.dealershipName} <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>#{d.id}</Text>
                        </Text>
                        <Text style={styles.protectedItemStats}>
                          {d.totalBids ?? 0} bid(s) · {d.wonBidsCount ?? d.wonBids?.length ?? 0} won
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.protectedNoticeText, { color: colors.mutedForeground }]}>
                    * Dealers with active bidding activity or won auctions cannot be deleted to maintain auction integrity.
                  </Text>
                </View>
              )}

              {/* Action notice */}
              {eligibleSelectedDealers.length === 0 ? (
                <View style={styles.noEligibleBox}>
                  <Text style={styles.noEligibleText}>
                    None of the selected dealers have 0 bids and 0 won auctions. No dealers can be deleted.
                  </Text>
                </View>
              ) : (
                <Text style={[styles.eligibleConfirmText, { color: colors.mutedForeground }]}>
                  Are you sure you want to permanently delete the{' '}
                  <Text style={{ fontWeight: '900', color: colors.foreground }}>
                    {eligibleSelectedDealers.length} eligible dealer(s)
                  </Text>? This action cannot be undone.
                </Text>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.bulkModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  (bulkDeleting || eligibleSelectedDealers.length === 0) && { opacity: 0.5 },
                ]}
                onPress={handleBulkDelete}
                disabled={bulkDeleting || eligibleSelectedDealers.length === 0}
                activeOpacity={0.8}
              >
                {bulkDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Trash2 size={14} color="#FFFFFF" />
                )}
                <Text style={styles.confirmDeleteText}>
                  {bulkDeleting ? 'Deleting...' : `Delete ${eligibleSelectedDealers.length} Dealer(s)`}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Import Summary Modal */}
      <Modal visible={showImportSummaryModal} transparent animationType="fade" onRequestClose={() => setShowImportSummaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.bulkModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Header */}
            <View style={[styles.bulkModalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.bulkModalHeaderLeft}>
                <View style={styles.importSuccessIcon}>
                  <Upload size={20} color="#FFC700" strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bulkModalTitle, { color: colors.foreground }]}>Excel Import Summary</Text>
                  <Text style={[styles.bulkModalSub, { color: colors.mutedForeground }]}>
                    Results from your uploaded spreadsheet
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowImportSummaryModal(false)}
                style={[styles.modalCloseBtn, { borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <X size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
              {/* 3 Summary Stats */}
              <View style={styles.bulkStatRow}>
                <View style={[styles.bulkStatCard, { backgroundColor: specPanelBg, borderColor: specBorder }]}>
                  <Text style={[styles.bulkStatLabel, { color: colors.mutedForeground }]}>TOTAL ROWS</Text>
                  <Text style={[styles.bulkStatValue, { color: colors.foreground }]}>
                    {importSummary?.totalRows ?? 0}
                  </Text>
                </View>

                <View style={[styles.bulkStatCard, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={[styles.bulkStatLabel, { color: '#10B981' }]}>IMPORTED</Text>
                  <Text style={[styles.bulkStatValue, { color: '#10B981' }]}>
                    {importSummary?.importedCount ?? 0}
                  </Text>
                </View>

                <View style={[styles.bulkStatCard, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                  <Text style={[styles.bulkStatLabel, { color: '#D97706' }]}>SKIPPED</Text>
                  <Text style={[styles.bulkStatValue, { color: '#D97706' }]}>
                    {importSummary?.skippedCount ?? 0}
                  </Text>
                </View>
              </View>

              {/* Issues / Skipped list */}
              {importSummary?.issues && importSummary.issues.length > 0 && (
                <View style={styles.importIssuesBox}>
                  <View style={styles.protectedHeaderRow}>
                    <AlertCircle size={14} color="#D97706" />
                    <Text style={styles.protectedHeaderText}>
                      Issues & Skipped Rows ({importSummary.issues.length}):
                    </Text>
                  </View>
                  <View style={[styles.importIssuesList, { borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.05)' }]}>
                    {importSummary.issues.map((issue, idx) => (
                      <View key={idx} style={styles.importIssueItem}>
                        <AlertCircle size={12} color="#D97706" style={{ marginTop: 2 }} />
                        <Text style={[styles.importIssueText, { color: colors.foreground }]}>
                          {issue}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Close Button */}
            <View style={[styles.bulkModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.importCloseBtn}
                onPress={() => setShowImportSummaryModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.importCloseBtnText}>Close</Text>
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

  // Top Actions Row
  topActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  selectAllBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12,
  },
  selectAllBtnText: { fontSize: 12, fontWeight: '800' },
  checkboxSmall: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  importBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#FFC700', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 12,
    shadowColor: '#FFC700', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2,
  },
  importBtnText: { color: '#0D0E12', fontSize: 12, fontWeight: '900' },
  importBtnDisabled: { opacity: 0.55 },

  // Checkbox in Card Header
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', marginRight: 2,
  },

  // Floating Bulk Action Bar
  bulkActionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  bulkActionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkSelectedBadge: {
    backgroundColor: '#FFC700', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  bulkSelectedBadgeText: { fontSize: 11, fontWeight: '900', color: '#0D0E12' },
  bulkSelectedText: { fontSize: 13, fontWeight: '800' },
  bulkActionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkDeselectBtn: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  bulkDeselectText: { fontSize: 11, fontWeight: '800' },
  bulkDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F43F5E', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#F43F5E', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  bulkDeleteText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },

  // Bulk Modal & Import Summary Modal
  bulkModalCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', width: '100%', maxWidth: 460 },
  bulkModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  bulkModalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  bulkModalTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  bulkModalSub: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  bulkStatRow: { flexDirection: 'row', gap: 8 },
  bulkStatCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  bulkStatLabel: { fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  bulkStatValue: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  protectedBox: { gap: 6 },
  protectedHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  protectedHeaderText: { fontSize: 11.5, fontWeight: '800', color: '#D97706' },
  protectedListWrap: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 6, maxHeight: 120 },
  protectedItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  protectedItemName: { fontSize: 11.5, fontWeight: '800', flex: 1, marginRight: 8 },
  protectedItemStats: { fontSize: 10.5, fontWeight: '700', color: '#D97706' },
  protectedNoticeText: { fontSize: 10, fontStyle: 'italic', lineHeight: 14 },
  noEligibleBox: {
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)',
    backgroundColor: 'rgba(244,63,94,0.08)', padding: 12, alignItems: 'center',
  },
  noEligibleText: { fontSize: 11.5, fontWeight: '800', color: '#F43F5E', textAlign: 'center' },
  eligibleConfirmText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  bulkModalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
  },
  importSuccessIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  importIssuesBox: { gap: 6 },
  importIssuesList: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 6, maxHeight: 150 },
  importIssueItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  importIssueText: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },
  importCloseBtn: {
    backgroundColor: '#FFC700', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10,
  },
  importCloseBtnText: { color: '#0D0E12', fontSize: 12, fontWeight: '900' },

  // Pagination Card
  paginationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
    gap: 10,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationCountText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  pageSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageSizeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  pageSizeChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pageSizeChipText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  paginationNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNavBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageNumBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pageIndicatorPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },

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

  // Freelancer Role Integration Styles
  dealerFreelancerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(2,132,199,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(2,132,199,0.3)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  dealerFreelancerTagText: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  makeFreelancerCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2,132,199,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(2,132,199,0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  makeFreelancerCardBtnText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  modalFreelancerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  modalFreelancerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(2,132,199,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(2,132,199,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalFreelancerTitle: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  modalFreelancerDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
    lineHeight: 14,
  },
  freelancerActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2,132,199,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(2,132,199,0.35)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  freelancerActiveBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalMakeFreelancerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  modalMakeFreelancerBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
});
