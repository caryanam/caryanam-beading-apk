import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Upload, CheckCircle2, XCircle, Menu, RefreshCw, Plus, ClipboardList, Camera, FileCheck, Download } from 'lucide-react-native';
import { inspectorService } from '../services/inspectorService';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { InspectorNotificationsModal } from '../components/InspectorNotificationsModal';

interface InspectorDashboardScreenProps {
  navigation: any;
  onOpenMenu: () => void;
}

export const InspectorDashboardScreen: React.FC<InspectorDashboardScreenProps> = ({ navigation, onOpenMenu }) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#12141C' : '#FFFFFF';
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (id: number) => {
    setDownloadingPdfId(id);
    try {
      await inspectorService.downloadPdf(id);
    } catch {
      // silent download
    } finally {
      setDownloadingPdfId(null);
    }
  };
  const [stats, setStats] = useState({
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchInspections = async () => {
    try {
      const res = await inspectorService.getMyInspections();
      if (res.success && res.data) {
        // Sort by inspection ID descending
        const sorted = [...res.data].sort((a: any, b: any) => b.inspectionId - a.inspectionId);
        setInspections(sorted);

        // Compute counts locally as fallback
        const drafts = sorted.filter((ins: any) => ins.status === 'DRAFT' || ins.status === 'IN_PROGRESS').length;
        const submitted = sorted.filter((ins: any) => ins.status === 'SUBMITTED').length;
        const approved = sorted.filter((ins: any) => ins.status === 'APPROVED').length;
        const rejected = sorted.filter((ins: any) => ins.status === 'REJECTED').length;

        setStats({
          draft: drafts,
          submitted: submitted,
          approved: approved,
          rejected: rejected,
        });

        // Attempt backend stats endpoint for authoritative numbers
        try {
          const statsRes = await inspectorService.getStats();
          if (statsRes.success && statsRes.data) {
            setStats({
              draft: statsRes.data.draftCount ?? drafts,
              submitted: statsRes.data.submittedCount ?? statsRes.data.vehiclesSubmitted ?? submitted,
              approved: statsRes.data.approvedCount ?? approved,
              rejected: statsRes.data.rejectedCount ?? rejected,
            });
          }
        } catch {
          // keep client-calculated fallback
        }
      }
    } catch (err: any) {
      console.error('Failed to load inspector dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspections();
  };

  const inr = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate activities (limit to 4)
  const activities = inspections
    .filter((ins) => ins.status !== 'DRAFT' && ins.status !== 'IN_PROGRESS')
    .map((ins) => {
      let title = '';
      const carName = `${ins.brand || ''} ${ins.model || ''} ${ins.variant || ''}`.trim();
      const time = formatDate(ins.submittedAt);

      if (ins.status === 'APPROVED') {
        title = `Inspection for ${carName} approved`;
      } else if (ins.status === 'REJECTED') {
        title = `Inspection for ${carName} rejected`;
      } else if (ins.status === 'SUBMITTED') {
        title = `Submitted inspection for ${carName}`;
      }

      return { title, time, status: ins.status };
    })
    .slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0D0E12' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconBtn}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ClipboardList size={15} color="#FFC700" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inspection Overview</Text>
        </View>
        <View style={styles.headerRightActions}>
          <InspectorNotificationsModal iconColor={colors.foreground} />
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
          {/* Welcome Card Banner */}
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeGlow} />
            <View style={styles.welcomeIconContainer}>
              <ClipboardList size={22} color="#0D0E12" />
            </View>
            <View style={styles.welcomeInfo}>
              <View style={styles.welcomeTitleRow}>
                <Text style={styles.welcomeTitle}>Inspection Console</Text>
                <View style={styles.rolePill}>
                  <CheckCircle2 size={9} color="#FFC700" />
                  <Text style={styles.rolePillText}>INSPECTOR</Text>
                </View>
              </View>
              <Text style={styles.welcomeSubtitle}>
                On-field telemetry uploads & status tracker
              </Text>
            </View>
          </View>

          {/* Stat cards grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              {/* Drafts */}
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                  <FileText size={16} color="#94A3B8" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{loading ? '...' : stats.draft}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Draft Inspections</Text>
                <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>In progress & saved drafts</Text>
              </View>

              {/* Submitted */}
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255, 199, 0, 0.12)' }]}>
                  <Upload size={16} color="#FFC700" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{loading ? '...' : stats.submitted}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Submitted Inspections</Text>
                <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>Awaiting admin approval</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              {/* Approved */}
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <CheckCircle2 size={16} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{loading ? '...' : stats.approved}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Approved Inspections</Text>
                <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>Live in marketplace</Text>
              </View>

              {/* Rejected */}
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                  <XCircle size={16} color="#F43F5E" />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{loading ? '...' : stats.rejected}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rejected Inspections</Text>
                <Text style={[styles.statDelta, { color: colors.mutedForeground }]}>Needs photo / data revision</Text>
              </View>
            </View>
          </View>

          {/* Start a new inspection CTA panel */}
          <View style={[styles.ctaCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.ctaHeader}>
              <View>
                <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Start a new inspection</Text>
                <Text style={[styles.ctaDesc, { color: colors.mutedForeground }]}>
                  Capture vehicle details, images and the 200-point report.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              {[
                { icon: ClipboardList, title: '1. Vehicle details', sub: 'RC, insurance, owner & spec capture.' },
                { icon: Camera, title: '2. Condition & media', sub: 'Upload images with preview.' },
                { icon: FileCheck, title: '3. Report & submit', sub: 'Attach PDF report & submit.' },
              ].map((step, idx) => (
                <View key={idx} style={[styles.stepCard, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}>
                  <View style={styles.stepIcon}>
                    <step.icon size={14} color="#FFC700" />
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                  <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>{step.sub}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate('InspectorAddVehicle')}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#0D0E12" style={{ marginRight: 6 }} />
              <Text style={styles.ctaBtnText}>Add Vehicle Report</Text>
            </TouchableOpacity>
          </View>

          {/* Recent uploads */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Recent Uploads</Text>
            {loading ? (
              <ActivityIndicator color="#FFC700" size="small" style={{ marginVertical: 40 }} />
            ) : inspections.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No inspections uploaded yet.</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Start by tapping "Add Vehicle Report" to create your first report.
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {inspections.slice(0, 5).map((v, index) => {
                  const s = (v.status || '').toUpperCase();
                  const isDraft = s === 'DRAFT' || s === 'IN_PROGRESS';
                  let chipText = 'Draft';
                  let chipColor = '#94A3B8';
                  let chipBg = 'rgba(148, 163, 184, 0.12)';

                  if (s === 'APPROVED') {
                    chipText = 'Approved';
                    chipColor = '#10B981';
                    chipBg = 'rgba(16, 185, 129, 0.12)';
                  } else if (s === 'REJECTED') {
                    chipText = 'Rejected';
                    chipColor = '#F43F5E';
                    chipBg = 'rgba(244, 63, 94, 0.12)';
                  } else if (s === 'SUBMITTED') {
                    chipText = 'Submitted';
                    chipColor = '#FFC700';
                    chipBg = 'rgba(255, 199, 0, 0.12)';
                  }

                  return (
                    <TouchableOpacity
                      key={v.inspectionId}
                      style={[styles.listItem, { borderBottomColor: colors.border }]}
                      onPress={() => navigation.navigate('InspectorVehicleDetail', { inspectionId: v.inspectionId })}
                      activeOpacity={0.85}
                    >
                      {v.vehicleImage ? (
                        <Image source={{ uri: v.vehicleImage }} style={styles.itemImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.itemImageFallback, { backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
                          <Text style={[styles.itemFallbackText, { color: colors.mutedForeground }]}>
                            {((v.brand || '').slice(0, 1) + (v.model || '').slice(0, 1)) || 'VE'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.itemBody}>
                        <View style={styles.itemNameRow}>
                          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                            {v.brand} {v.model} {v.variant}
                          </Text>
                          <View style={styles.itemIdPill}>
                            <Text style={[styles.itemId, { color: colors.mutedForeground }]}>#{index + 1}</Text>
                          </View>
                        </View>
                        <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {v.vehicleNumber} • suggested {v.suggestedPrice ? inr(v.suggestedPrice) : 'N/A'} • Inspector: {v.inspectorName}
                        </Text>
                      </View>
                      {isDraft ? (
                        <TouchableOpacity
                          style={styles.editDraftBtn}
                          onPress={() => navigation.navigate('InspectorAddVehicle', { inspectionId: v.inspectionId })}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.editDraftText}>Edit Draft</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TouchableOpacity
                            style={[styles.pdfBtn, { backgroundColor: isDark ? '#171A24' : '#F2F4FA', borderColor: colors.border }]}
                            disabled={downloadingPdfId === v.inspectionId}
                            onPress={() => handleDownloadPdf(v.inspectionId)}
                            activeOpacity={0.8}
                          >
                            {downloadingPdfId === v.inspectionId ? (
                              <ActivityIndicator size="small" color="#FFC700" />
                            ) : (
                              <Download size={13} color={colors.foreground} />
                            )}
                            <Text style={[styles.pdfBtnText, { color: colors.foreground }]}>PDF</Text>
                          </TouchableOpacity>
                          <View style={[styles.chip, { backgroundColor: chipBg }]}>
                            <Text style={[styles.chipText, { color: chipColor }]}>{chipText}</Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Activity timeline */}
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: colors.border, marginTop: 18 }]}>
            <View style={styles.panelHeaderRow}>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>Activity</Text>
              {activities.length > 0 && (
                <View style={styles.activityCountPill}>
                  <Text style={styles.activityCountText}>{activities.length} RECENT</Text>
                </View>
              )}
            </View>
            {activities.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No recent activity logs.</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {activities.map((a, idx) => {
                  let dotColor = '#94A3B8';
                  if (a.status === 'APPROVED') dotColor = '#10B981';
                  else if (a.status === 'REJECTED') dotColor = '#F43F5E';
                  else if (a.status === 'SUBMITTED') dotColor = '#FFC700';

                  return (
                    <View key={idx} style={styles.timelineItem}>
                      <View style={styles.timelineLineWrapper}>
                        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                        {idx < activities.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={[styles.timelineTitleText, { color: colors.foreground }]}>{a.title}</Text>
                        <Text style={[styles.timelineTimeText, { color: colors.mutedForeground }]}>{a.time}</Text>
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
  },
  headerIconBtn: {
    padding: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentBody: {
    padding: 16,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E12',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  welcomeGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
  },
  welcomeIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 199, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rolePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFC700',
    letterSpacing: 0.4,
  },
  welcomeSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
    marginTop: 3,
  },
  statsGrid: {
    marginBottom: 18,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  statDelta: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 3,
  },
  ctaCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  ctaHeader: {
    marginBottom: 14,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  ctaDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 5,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 199, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  stepSub: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 11,
  },
  ctaBtn: {
    backgroundColor: '#FFC700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaBtnText: {
    color: '#0D0E12',
    fontSize: 12,
    fontWeight: '900',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activityCountPill: {
    backgroundColor: 'rgba(255, 199, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activityCountText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFC700',
    letterSpacing: 0.4,
  },
  emptyView: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 15,
  },
  listContainer: {
    gap: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  itemImageFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemFallbackText: {
    fontSize: 14,
    fontWeight: '900',
  },
  itemBody: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  itemIdPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemId: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 3,
  },
  editDraftBtn: {
    backgroundColor: 'rgba(255, 199, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editDraftText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFC700',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLineWrapper: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
    marginTop: 5,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineTimeText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pdfBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
