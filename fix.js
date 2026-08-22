const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminLiveBiddingScreen.tsx', 'utf8');

// 1. replace fetchRooms
const oldFetchRegex = /const fetchRooms = async \(showMsg = false\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*setRefreshing\(false\);\s*\}\s*\};/;
const newFetch = `const fetchRooms = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const [insRes, freeRes] = await Promise.all([
        adminService.getSubmittedInspections(),
        adminService.getFreelancerInspections()
      ]);

      let inspectorList = [];
      if (insRes.success && insRes.data) {
        inspectorList = insRes.data.map((ins) => ({
          ...ins,
          inspectionId: ins.inspectionId || ins.id,
          sourceType: 'INSPECTOR',
        }));
      }

      let freelancerList = [];
      if (freeRes.success && freeRes.data) {
        freelancerList = freeRes.data.map((item) => {
          const insId = item.inspectionId || item.id;
          return {
            ...item,
            inspectionId: insId,
            vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || \`INS-\${insId}\`,
            brand: item.brand || '',
            model: item.model || '',
            variant: item.variant || '',
            ownerName: item.ownerName || '1st Owner',
            suggestedPrice: item.suggestedPrice || item.price || 0,
            submittedAt: item.submittedAt || item.createdAt || null,
            inspectorName: item.freelancerName || item.inspectorName || item.inspector?.fullName || (item.inspectorId ? \`Freelancer #\${item.inspectorId}\` : 'Freelancer'),
            status: item.status || 'APPROVED',
            vehicleStatus: item.vehicleStatus || item.status || 'LIVE',
            sourceType: 'FREELANCER',
          };
        });
      }

      const combined = [...inspectorList, ...freelancerList];
      const liveOnly = combined.filter(
        (ins) => String(ins.vehicleStatus || ins.status || '').toUpperCase() === 'LIVE'
      );

      setInspections(liveOnly);
      if (
        liveOnly.length > 0 &&
        (selectedId === null || !liveOnly.some((i) => i.inspectionId === selectedId))
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
  };`;

content = content.replace(oldFetchRegex, newFetch);

// 2. replace filteredInspections
const oldFilterRegex = /const filteredInspections = useMemo\(\(\) => \{[\s\S]*?\}, \[inspections, searchQuery\]\);/;
const newFilter = `const filteredInspections = useMemo(() => {
    let list = inspections;
    if (activeTab === 'inspector') {
      list = list.filter((i) => i.sourceType === 'INSPECTOR');
    } else if (activeTab === 'freelancer') {
      list = list.filter((i) => i.sourceType === 'FREELANCER');
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
  }, [inspections, activeTab, searchQuery]);`;

content = content.replace(oldFilterRegex, newFilter);

fs.writeFileSync('src/screens/AdminLiveBiddingScreen.tsx', content);
console.log('Successfully updated JS script!');
