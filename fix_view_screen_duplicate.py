import re

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"const engineSlots = \[\s*\{ type: 'ENGINE_IMAGE', label: 'ENGINE ROOM PHOTO' \},\s*\{ type: 'BATTERY_IMAGE', label: 'BATTERY BAY PHOTO' \},\s*\{ type: 'Engine / Motor Noise', label: 'ENGINE NOISE VIDEO' \},\s*\];"
replacement = """const engineSlots = [
    { type: 'ENGINE_IMAGE', label: 'ENGINE ROOM PHOTO' },
    { type: 'BATTERY_IMAGE', label: 'BATTERY BAY PHOTO' },
  ];"""

content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
