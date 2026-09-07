import re

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(const renderMedia = \(url: string \| null \| undefined, label: string\) => \{\s+const resolved = resolveMediaUrl\(url\);\s+if \(!resolved\) \{\s+return \(\s+<View style=\{\[styles\.mediaEmpty, \{ backgroundColor: isDark \? '#171A24' : '#F2F4FA' \}\]\}>\s+)(<Camera size=\{16\} color=\{colors\.mutedForeground\} />\s+<Text style=\{\[styles\.mediaEmptyText, \{ color: colors\.mutedForeground \}\]\}>No photo attached</Text>)"
replacement = r"\1{label.includes('Noise') ? <Video size={16} color={colors.mutedForeground} /> : <Camera size={16} color={colors.mutedForeground} />}\n            <Text style={[styles.mediaEmptyText, { color: colors.mutedForeground }]}>{label.includes('Noise') ? 'No video attached' : 'No photo attached'}</Text>"

content = re.sub(pattern, replacement, content)

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
