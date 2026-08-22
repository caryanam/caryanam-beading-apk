const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminFreelancersScreen.tsx', 'utf8');

content = content.replace(
  '    X,\n} from \'lucide-react-native\';',
  '    X,\n    ChevronRight,\n} from \'lucide-react-native\';'
);

const regex = /\{\/\*\s*Uploads Badge\s*\*\/\}\s*<View style=\{styles\.uploadsBadge\}>\s*<Car size=\{11\} color="#FFC700" \/>\s*<Text style=\{styles\.uploadsBadgeText\}>\{ins\.uploads\} Vehicles Uploaded<\/Text>\s*<\/View>/;

const replacement = `                  {/* Uploads Badge & Actions */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <View style={styles.uploadsBadge}>
                      <Car size={11} color="#FFC700" />
                      <Text style={styles.uploadsBadgeText}>{ins.uploads} Vehicles Uploaded</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                      onPress={() => navigation.navigate('AdminVehicles', { tab: 'freelancer', inspector: ins.name })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.foreground }}>View Vehicles</Text>
                      <ChevronRight size={13} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/screens/AdminFreelancersScreen.tsx', content);
    console.log('Successfully updated AdminFreelancersScreen!');
} else {
    console.log('Target block not found!');
}
