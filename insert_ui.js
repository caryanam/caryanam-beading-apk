const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminLiveBiddingScreen.tsx', 'utf8');

// 1. Insert UI Tabs
const uiTarget = `          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>`;

const uiReplacement = `          {/* Tab Filter */}
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
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1A1D28' : '#F0F2F7', borderColor: colors.border }]}>`;

if (content.includes(uiTarget) && !content.includes('{/* Tab Filter */}')) {
    content = content.replace(uiTarget, uiReplacement);
}

// 2. Fix card tag rendering
const tagTarget = `                  <View style={styles.roomTopRow}>
                    <View style={[styles.roomLiveChip, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                      <View style={styles.liveDot} />
                      <Text style={styles.roomLiveText}>Live Room</Text>
                    </View>`;

const tagReplacement = `                  <View style={styles.roomTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.roomLiveChip, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.roomLiveText}>Live</Text>
                      </View>
                      <View style={[styles.roomLiveChip, { backgroundColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)', borderColor: v.sourceType === 'FREELANCER' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)' }]}>
                        <Text style={[styles.roomLiveText, { color: v.sourceType === 'FREELANCER' ? '#A855F7' : '#3B82F6' }]}>{v.sourceType === 'FREELANCER' ? 'Freelancer' : 'Inspector'}</Text>
                      </View>
                    </View>`;

if (content.includes(tagTarget)) {
    content = content.replace(tagTarget, tagReplacement);
}

fs.writeFileSync('src/screens/AdminLiveBiddingScreen.tsx', content);
console.log('Successfully inserted UI Tabs and Tags!');
