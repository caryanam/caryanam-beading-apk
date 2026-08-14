import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Bell, BellOff, X, CheckCheck, ChevronRight } from 'lucide-react-native';
import { inspectorService } from '../services/inspectorService';
import { useTheme } from '../context/ThemeContext';

interface InspectorNotificationItem {
  isRead?: boolean;
  id: number;
  rawId: number;
  title: string;
  meta: string;
  time: string;
  status: string;
  link: string | null;
}

// Matches web formatIndianDateTime
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
  if (/^\d{10,13}$/.test(trimmed)) {
    const d = new Date(parseInt(trimmed, 10));
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
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let relative = '';
  if (diffMin <= 1) relative = '1 min ago';
  else if (diffMin < 60) relative = `${diffMin} mins ago`;
  else if (diffHr < 24) relative = `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  else if (diffDay < 7) relative = `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  else relative = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${relative} (${exactTime.toLowerCase()})`;
}

const formatIndianDateTime = (input: string | number | Date | null | undefined): string => {
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
};

const dotColorFor = (status: string): string => {
  const s = (status || '').toUpperCase();
  if (s === 'REJECTED') return '#F43F5E';
  if (s === 'SUBMITTED' || s === 'PENDING') return '#F59E0B';
  return '#10B981';
};

interface InspectorNotificationsModalProps {
  iconColor?: string;
}

export const InspectorNotificationsModal: React.FC<InspectorNotificationsModalProps> = ({ iconColor }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<InspectorNotificationItem[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);





  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {


      let list: InspectorNotificationItem[] = [];
      const res = await inspectorService.getMyInspections();
      if (res.success && res.data) {
        list = res.data
          .filter((ins: any) => ins.status !== 'DRAFT' && ins.status !== 'IN_PROGRESS')
          .map((ins: any) => {
            const carName = `${ins.brand || ''} ${ins.model || ''} ${ins.variant || ''}`.trim();
            let notifTitle = '';
            let notifMeta = '';
            if (ins.status === 'APPROVED') {
              notifTitle = `Inspection Approved: ${carName}`;
              notifMeta = `Vehicle ${ins.vehicleNumber} approved by Admin and ready for live bidding.`;
            } else if (ins.status === 'REJECTED') {
              notifTitle = `Inspection Rejected: ${carName}`;
              notifMeta = `Vehicle ${ins.vehicleNumber} rejected. Reason: ${ins.rejectionReason || 'Please verify details.'}`;
            } else {
              notifTitle = `Inspection Submitted: ${carName}`;
              notifMeta = `Report for ${ins.vehicleNumber} submitted successfully and pending approval.`;
            }
            return {
              id: ins.inspectionId,
              rawId: ins.inspectionId,
              title: notifTitle,
              meta: notifMeta,
              time: formatIndianDateTime(ins.submittedAt),
              status: ins.status,
              link: ins.inspectionId ? String(ins.inspectionId) : null,
            };
          });
      }

      list.sort((a, b) => b.rawId - a.rawId);
      setItems(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load inspector notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = () => {
    setVisible(true);
    fetchNotifications();
  };

  const markSingleAsRead = async (rawId: number) => {
    try {
      await inspectorService.markNotificationAsRead(rawId);
      setItems((prev) =>
        prev.map((item) => (item.rawId === rawId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark inspector notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await inspectorService.markAllNotificationsAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all inspector notifications as read', err);
    }
  };

  const cardBg = isDark ? '#12141C' : '#FFFFFF';

  return (
    <>
      <TouchableOpacity onPress={openModal} style={styles.bellBtn} activeOpacity={0.7}>
        <Bell size={18} color={iconColor || colors.foreground} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]} onPress={() => {}}>
            {/* Header */}
            <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.panelHeaderLeft}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>{unreadCount} UNREAD</Text>
                  </View>
                )}
              </View>
              <View style={styles.panelHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn} activeOpacity={0.7}>
                    <CheckCheck size={12} color="#FFC700" />
                    <Text style={styles.markAllText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Body */}
            <ScrollView style={styles.panelBody} showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelBodyContent}>
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color="#FFC700" />
                </View>
              ) : items.length === 0 ? (
                <View style={styles.centerBox}>
                  <BellOff size={32} color={colors.mutedForeground} style={styles.emptyIcon} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No recent notifications</Text>
                </View>
              ) : (
                items.map((n) => {
                  const isRead = !!n.isRead;
                  const dotBg = dotColorFor(n.status);
                  return (
                    <TouchableOpacity
                      key={n.id}
                      onPress={() => markSingleAsRead(n.rawId)}
                      activeOpacity={0.7}
                      style={[
                        styles.notifItem,
                        { borderBottomColor: colors.border },
                        isRead
                          ? { backgroundColor: 'transparent', opacity: 0.6 }
                          : { backgroundColor: isDark ? 'rgba(255,199,0,0.06)' : 'rgba(255,199,0,0.05)', borderColor: isDark ? 'rgba(255,199,0,0.3)' : 'rgba(255,199,0,0.35)' },
                      ]}
                    >
                      <View style={[styles.dot, { backgroundColor: dotBg }]} />
                      <View style={styles.notifContent}>
                        <View style={styles.notifTitleRow}>
                          <Text numberOfLines={1} style={[styles.notifTitle, { color: colors.foreground }]}>
                            {n.title}
                          </Text>
                          <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{n.time}</Text>
                        </View>
                        <Text style={[styles.notifMeta, { color: colors.mutedForeground }]}>{n.meta}</Text>
                      </View>
                      {n.link && (
                        <View style={styles.notifLinkArrow}>
                          <ChevronRight size={13} color="#FFC700" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellBtn: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFC700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeText: {
    color: '#0D0E12',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '78%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  unreadPill: {
    backgroundColor: '#FFC700',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadPillText: {
    color: '#0D0E12',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  panelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  markAllText: {
    color: '#FFC700',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  panelBody: {
    flexGrow: 0,
  },
  panelBodyContent: {
    paddingBottom: 12,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  notifTime: {
    fontSize: 9,
    fontWeight: '700',
  },
  notifMeta: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  notifLinkArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
});