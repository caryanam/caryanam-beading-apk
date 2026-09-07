import re

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(      if \(isVideoUrl\(resolved\)\) \{)"
replacement = r"      if (isVideoUrl(resolved) || label.includes('Noise')) {"

content = re.sub(pattern, replacement, content)

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
