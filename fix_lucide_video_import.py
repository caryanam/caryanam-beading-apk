import re

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Camera,", "Camera,\n  Video as VideoIcon,")
content = content.replace("<Video size={16}", "<VideoIcon size={16}")

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
