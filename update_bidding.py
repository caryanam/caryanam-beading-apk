import re

with open('src/screens/AdminLiveBiddingScreen.tsx', 'r', encoding='utf8') as f:
    content = f.read()

# 1. Add activeTab state
state_match = re.search(r'const \[searchQuery, setSearchQuery\] = useState\(\'\'\);', content)
if state_match:
    content = content[:state_match.end()] + '\n  const [activeTab, setActiveTab] = useState<\'all\' | \'inspector\' | \'freelancer\'>(\'all\');' + content[state_match.end():]

# 2. Replace fetchRooms
old_fetch = r'''    const fetchRooms = async \(showMsg = false\) => \{
      if \(showMsg\) setRefreshing\(true\);
      try \{
        const res = await adminService\.getSubmittedInspections\(\);
        if \(res\.success && res\.data\) \{
          const liveOnly = res\.data\.filter\(
            \(ins: any\) => ins\.status === 'APPROVED' && ins\.vehicleStatus === 'LIVE',
          \);
          setInspections\(liveOnly\);
          if \(
            liveOnly\.length > 0 &&
            \(selectedId === null \|\| !liveOnly\.some\(\(i: any\) => i\.inspectionId === selectedId\)\)
          \) \{
            setSelectedId\(liveOnly\[0\]\.inspectionId\);
          \}
          if \(showMsg\) showToast\(\{ message: 'Active live bidding rooms refreshed', type: 'success' \}\);
        \}
      \} catch \{
        if \(showMsg\) showToast\(\{ message: 'Failed to refresh live rooms', type: 'error' \}\);
      \} finally \{
        setLoading\(false\);
        setRefreshing\(false\);
      \}
    \};'''

new_fetch = '''    const fetchRooms = async (showMsg = false) => {
      if (showMsg) setRefreshing(true);
      try {
        const [insRes, freeRes] = await Promise.all([
          adminService.getSubmittedInspections(),
          (adminService as any).getFreelancerInspections ? (adminService as any).getFreelancerInspections() : Promise.resolve({ success: false, data: [] })
        ]);

        let inspectorList: any[] = [];
        if (insRes.success && insRes.data) {
          inspectorList = insRes.data.map((ins: any) => ({
            ...ins,
            inspectionId: ins.inspectionId || ins.id,
            sourceType: 'INSPECTOR',
          }));
        }

        let freelancerList: any[] = [];
        if (freeRes.success && freeRes.data) {
          freelancerList = freeRes.data.map((item: any) => {
            const insId = item.inspectionId || item.id;
            return {
              ...item,
              inspectionId: insId,
              vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || `INS-${insId}`,
              brand: item.brand || '',
              model: item.model || '',
              variant: item.variant || '',
              ownerName: item.ownerName || '1st Owner',
              suggestedPrice: item.suggestedPrice || item.price || 0,
              submittedAt: item.submittedAt || item.createdAt || null,
              inspectorName: item.freelancerName || item.inspectorName || item.inspector?.fullName || (item.inspectorId ? `Freelancer #${item.inspectorId}` : 'Freelancer'),
              status: item.status || 'APPROVED',
              vehicleStatus: item.vehicleStatus || item.status || 'LIVE',
              sourceType: 'FREELANCER',
            };
          });
        }

        const combined = [...inspectorList, ...freelancerList];
        const liveOnly = combined.filter(
          (ins: any) => String(ins.vehicleStatus || ins.status || '').toUpperCase() === 'LIVE'
        );

        setInspections(liveOnly);
        if (
          liveOnly.length > 0 &&
          (selectedId === null || !liveOnly.some((i: any) => i.inspectionId === selectedId))
        ) {
          setSelectedId(liveOnly[0].inspectionId);
        }
        if (showMsg) showToast({ message: 'Active live bidding rooms refreshed', type: 'success' });
      } catch (err) {
        if (showMsg) showToast({ message: 'Failed to refresh live rooms', type: 'error' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };'''

# Use simple string replacement instead of regex for the large blocks to avoid escape sequence issues
content = content.replace('''    const fetchRooms = async (showMsg = false) => {
      if (showMsg) setRefreshing(true);
      try {
        const res = await adminService.getSubmittedInspections();
        if (res.success && res.data) {
          const liveOnly = res.data.filter(
            (ins: any) => ins.status === 'APPROVED' && ins.vehicleStatus === 'LIVE',
          );
          setInspections(liveOnly);
          if (
            liveOnly.length > 0 &&
            (selectedId === null || !liveOnly.some((i: any) => i.inspectionId === selectedId))
          ) {
            setSelectedId(liveOnly[0].inspectionId);
          }
          if (showMsg) showToast({ message: 'Active live bidding rooms refreshed', type: 'success' });
        }
      } catch {
        if (showMsg) showToast({ message: 'Failed to refresh live rooms', type: 'error' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };''', new_fetch)

# 3. Replace filteredInspections
new_filter = '''    const filteredInspections = useMemo(() => {
      let list = inspections;
      if (activeTab === 'inspector') {
        list = list.filter((i: any) => i.sourceType === 'INSPECTOR');
      } else if (activeTab === 'freelancer') {
        list = list.filter((i: any) => i.sourceType === 'FREELANCER');
      }
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
        (i) =>
          (i.brand || '').toLowerCase().includes(q) ||
          (i.model || '').toLowerCase().includes(q) ||
          (i.variant || '').toLowerCase().includes(q) ||
          (i.vehicleNumber || '').toLowerCase().includes(q),
      );
    }, [inspections, activeTab, searchQuery]);'''

content = content.replace('''    const filteredInspections = useMemo(() => {
      if (!searchQuery.trim()) return inspections;
      const q = searchQuery.toLowerCase();
      return inspections.filter(
        (i) =>
          (i.brand || '').toLowerCase().includes(q) ||
          (i.model || '').toLowerCase().includes(q) ||
          (i.variant || '').toLowerCase().includes(q) ||
          (i.vehicleNumber || '').toLowerCase().includes(q),
      );
    }, [inspections, searchQuery]);''', new_filter)

# 4. Insert UI Tabs
ui_target = '''            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>'''

ui_replacement = '''            {/* Tab Filter */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity onPress={() => setActiveTab('all')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'all' ? '#FFC700' : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'all' ? '#0D0E12' : colors.mutedForeground }}>All ({inspections.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('inspector')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'inspector' ? '#FFC700' : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'inspector' ? '#0D0E12' : colors.mutedForeground }}>Inspector</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('freelancer')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === 'freelancer' ? '#FFC700' : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'freelancer' ? '#0D0E12' : colors.mutedForeground }}>Freelancer</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>'''

content = content.replace(ui_target, ui_replacement)

# 5. Fix card tag rendering
tag_target = r'''                    <View style={styles.roomTopRow}>
                      <View style={[styles.roomLiveChip, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.roomLiveText}>Live Room</Text>
                      </View>'''

tag_replacement = '''                    <View style={styles.roomTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.roomLiveChip, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                          <View style={styles.liveDot} />
                          <Text style={styles.roomLiveText}>Live</Text>
                        </View>
                        <View style={[styles.roomLiveChip, { backgroundColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)', borderColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)' }]}>
                          <Text style={[styles.roomLiveText, { color: v.sourceType === 'FREELANCER' ? '#A855F7' : '#3B82F6' }]}>{v.sourceType === 'FREELANCER' ? 'Freelancer' : 'Inspector'}</Text>
                        </View>
                      </View>'''

content = content.replace(tag_target.replace('\\[', '[').replace('\\]', ']'), tag_replacement)

with open('src/screens/AdminLiveBiddingScreen.tsx', 'w', encoding='utf8') as f:
    f.write(content)

print("Done")
