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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  RefreshCw,
  Users,
  Mail,
  Phone,
  Car,
  Search,
  X,
} from 'lucide-react-native';
import { adminService } from '../services/adminService';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface Inspector {
  id: number;
  name: string;
  email: string;
  mobile: string;
  uploads: number;
  status: string;
}

interface AdminInspectorsScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const AdminInspectorsScreen: React.FC<AdminInspectorsScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data Fetching ──────────────────────────────────────

  const fetchInspectors = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const res = await adminService.getRegisteredInspectors();
      if (res.success && res.data) {
        const list: Inspector[] = res.data.map((item: any) => ({
          id: item.id,
          name: item.fullName || 'N/A',
          email: item.email || 'N/A',
          mobile: item.mobileNumber || 'N/A',
          uploads: item.uploads ?? 0,
          status: 'active',
        }));
        setInspectors(list);
        if (showMsg) showToast({ message: 'Inspectors list refreshed', type: 'success' });
      }
    } catch {
      // silent fetch error log
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => fetchInspectors(true);

  // ── Search & Filter ────────────────────────────────────

  const filteredInspectors = useMemo(() => {
    if (!searchQuery.trim()) return inspectors;
    const q = searchQuery.toLowerCase();
    return inspectors.filter((ins) =>
      [ins.name, ins.email, ins.mobile].join(' ').toLowerCase().includes(q),
    );
  }, [inspectors, searchQuery]);

  // ── Actions ────────────────────────────────────────────

  const handleManage = (inspector: Inspector) => {
    navigation.navigate('AdminVehicles', { inspector: inspector.name });
  };

  // Theme-aware card colors
  const cardBg       = isDark ? '#12141C' : '#FFFFFF';
  const cardHeaderBg = isDark ? '#1A1D28' : '#EEF0F6';

  // ── Render ─────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>

      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Users size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inspectors</Text>
          {inspectors.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{inspectors.length}</Text>
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
            placeholder="Search by inspector name, email, mobile..."
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
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading inspectors...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />}
          showsVerticalScrollIndicator={false}
        >
          {filteredInspectors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Inspectors Found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {searchQuery.trim()
                  ? `No inspector matches "${searchQuery}"`
                  : 'No registered inspectors available yet.'}
              </Text>
            </View>
          ) : (
            filteredInspectors.map((ins) => (
              <View
                key={ins.id}
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
                    <View style={styles.avatarWrap}>
                      <Text style={styles.avatarText}>{(ins.name || 'NA').slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.inspectorName, { color: colors.foreground }]} numberOfLines={1}>
                      {ins.name}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.manageBtn} onPress={() => handleManage(ins)} activeOpacity={0.75}>
                    <Text style={styles.manageBtnText}>Manage</Text>
                  </TouchableOpacity>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Mail size={12} color={colors.mutedForeground} />
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email:</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{ins.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Phone size={12} color={colors.mutedForeground} />
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Mobile:</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{ins.mobile}</Text>
                  </View>

                  {/* Uploads Badge */}
                  <View style={styles.uploadsBadge}>
                    <Car size={11} color="#FFC700" />
                    <Text style={styles.uploadsBadgeText}>{ins.uploads} Vehicles Uploaded</Text>
                  </View>
                </View>
              </View>
            ))
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
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptySub: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Inspector Card
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardGlowTop: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, zIndex: 0 },
  cardGlowBottom: { position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: 75, zIndex: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 8 },
  avatarWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '900', color: '#FFC700' },
  inspectorName: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.3 },
  manageBtn: {
    backgroundColor: 'rgba(255,199,0,0.12)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.25)', paddingHorizontal: 12, paddingVertical: 7,
  },
  manageBtnText: { color: '#FFC700', fontSize: 10.5, fontWeight: '900' },

  cardBody: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoLabel: { fontSize: 11, fontWeight: '800', width: 58 },
  infoValue: { fontSize: 12, fontWeight: '600', flex: 1 },
  uploadsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,199,0,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
  },
  uploadsBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFC700' },
});
