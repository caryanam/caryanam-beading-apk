import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MessageSquare, Calendar, User, Mail, Phone, Menu, ArrowLeft, RefreshCw, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminNotificationsModal } from '../components/AdminNotificationsModal';
import { TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, apiClient } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type AdminNavigationProp = StackNavigationProp<any>;

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

interface AdminEnquiriesScreenProps {
  onOpenMenu: () => void;
}

export const AdminEnquiriesScreen: React.FC<AdminEnquiriesScreenProps> = ({ onOpenMenu }) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<AdminNavigationProp>();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/admin/enquiry');
      const data = response.data;
      if (data.success) {
        setEnquiries(data.data || []);
      } else {
        showToast({ message: data.message || 'Failed to load enquiries', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Network error while loading enquiries', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnquiries();
  };

  const renderEnquiry = ({ item }: { item: Enquiry }) => {
    const date = new Date(item.createdAt);
    const isDark = colors.background === '#0D0E12';

    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#14161C' : '#FFFFFF', borderColor: colors.border }]}>
        {/* Glow Effects */}
        {isDark && (
          <>
            <View style={[styles.cardGlowTop, { backgroundColor: 'rgba(255,199,0,0.03)' }]} />
            <View style={[styles.cardGlowBottom, { backgroundColor: 'rgba(255,199,0,0.02)' }]} />
          </>
        )}

        {/* Header */}
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.userIconWrap}>
              <User size={16} color="#FFC700" />
            </View>
            <View>
              <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.dateContainer}>
                <Calendar size={10} color={colors.mutedForeground} />
                <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>EMAIL</Text>
            <Mail size={12} color={colors.mutedForeground} />
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>PHONE</Text>
            <Phone size={12} color={colors.mutedForeground} />
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.phone}</Text>
          </View>

          <View style={[styles.messageContainer, { backgroundColor: isDark ? '#0D0E12' : '#F8FAFC', borderColor: colors.border }]}>
            <View style={styles.messageHeader}>
              <MessageSquare size={12} color="#FFC700" />
              <Text style={styles.messageHeaderTitle}>ENQUIRY MESSAGE</Text>
            </View>
            <Text style={[styles.messageText, { color: colors.foreground }]}>{item.message}</Text>
          </View>
          

        </View>
      </View>
    );
  };

  const isDark = colors.background === '#0D0E12';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MessageSquare size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Enquiries</Text>
          {enquiries.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{enquiries.length}</Text>
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
            placeholder="Search enquiries by name, email..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC700" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading Enquiries...</Text>
        </View>
      ) : (
      <FlatList
        data={enquiries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={item => item.id.toString()}
        renderItem={renderEnquiry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC700" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No enquiries found</Text>
          </View>
        }
      />
          )}    
    </SafeAreaView>
  );
};

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
  listContent: { padding: 14, gap: 12, paddingBottom: 40 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Card UI
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative', borderLeftWidth: 5, borderLeftColor: '#FFC700', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardGlowTop: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, zIndex: 0 },
  cardGlowBottom: { position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: 75, zIndex: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  userIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,199,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { fontSize: 10, fontWeight: '600' },
  
  cardBody: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 10, fontWeight: '800', width: 45, letterSpacing: 0.5 },
  infoValue: { fontSize: 12, fontWeight: '600', flex: 1 },

  messageContainer: { 
    marginTop: 6, padding: 12, borderRadius: 12, 
    borderWidth: 1, gap: 6 
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  messageHeaderTitle: { fontSize: 9, fontWeight: '900', color: '#FFC700', letterSpacing: 0.8 },
  messageText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,199,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,199,0,0.3)' },
  actionBtnText: { color: '#FFC700', fontSize: 12, fontWeight: '800' },
});
