const fs = require('fs');
let content = fs.readFileSync('src/screens/AdminFreelancersScreen.tsx', 'utf8');

// Remove handleManage
content = content.replace(/const handleManage = [\s\S]*?};\n/, '');

// Remove Manage Button
content = content.replace(/<TouchableOpacity style=\{styles\.manageBtn\} onPress=\{.*\} activeOpacity=\{0\.75\}>\s*<Text style=\{styles\.manageBtnText\}>Manage<\/Text>\s*<\/TouchableOpacity>/g, '');

// Remove styles
content = content.replace(/manageBtn: \{[\s\S]*?\},/g, '');
content = content.replace(/manageBtnText: \{[\s\S]*?\},/g, '');

fs.writeFileSync('src/screens/AdminFreelancersScreen.tsx', content);
console.log('Removed Manage button');
