const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminAnalyticsScreen.tsx', 'utf8');

const oldFetchRegex = /const fetchAnalytics = async \(showMsg = false\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*setRefreshing\(false\);\s*\}\s*\};/;

const newFetch = `const fetchAnalytics = async (showMsg = false) => {
    if (showMsg) setRefreshing(true);
    try {
      const [dealRes, insRes, freeRes] = await Promise.allSettled([
        adminService.getRegisteredDealers(),
        adminService.getSubmittedInspections(),
        adminService.getFreelancerInspections ? adminService.getFreelancerInspections() : Promise.resolve({ success: false, data: [] })
      ]);

      if (dealRes.status === 'fulfilled' && dealRes.value?.success && dealRes.value?.data) {
        setDealers(dealRes.value.data);
      }

      let inspectorList = [];
      if (insRes.status === 'fulfilled' && insRes.value?.success && insRes.value?.data) {
        inspectorList = insRes.value.data.map((ins) => ({
          ...ins,
          inspectionId: ins.inspectionId || ins.id,
          sourceType: 'INSPECTOR',
        }));
      }

      let freelancerList = [];
      if (freeRes.status === 'fulfilled' && freeRes.value?.success && freeRes.value?.data) {
        freelancerList = freeRes.value.data.map((item) => {
          const insId = item.inspectionId || item.id;
          let curStatus = String(item.status || item.vehicleStatus || 'APPROVED').toUpperCase();
          if (curStatus === 'SUBMITTED' || curStatus === 'PENDING' || curStatus === 'PENDING_APPROVAL') {
            curStatus = 'APPROVED';
          }
          return {
            ...item,
            inspectionId: insId,
            vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || \`INS-\${insId}\`,
            brand: item.brand || '',
            model: item.model || '',
            variant: item.variant || '',
            status: curStatus,
            vehicleStatus: item.vehicleStatus || curStatus || 'LIVE',
            sourceType: 'FREELANCER',
          };
        });
      }

      const combined = [...inspectorList, ...freelancerList];
      setInspections(combined);

      if (showMsg) showToast({ message: 'Analytics refreshed', type: 'success' });
    } catch {
      showToast({ message: 'Failed to load analytics datasets.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };`;

if (oldFetchRegex.test(content)) {
    content = content.replace(oldFetchRegex, newFetch);
    fs.writeFileSync('src/screens/AdminAnalyticsScreen.tsx', content);
    console.log('Successfully updated AdminAnalyticsScreen fetch logic!');
} else {
    console.log('Regex did not match in AdminAnalyticsScreen!');
}
