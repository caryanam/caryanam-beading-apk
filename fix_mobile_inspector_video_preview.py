import re

with open('src/screens/InspectorAddVehicleScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';", "import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';\nimport RNVideo from 'react-native-video';")

# Replace PhotoSlot video preview
target1 = """            <View style={styles.videoPreview}>
              <Video size={22} color="#FFC700" />
              <Text style={styles.videoPreviewText}>Video captured</Text>
            </View>"""
replacement1 = """            <RNVideo
              source={{ uri: resolved }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              controls={true}
              paused={true}
            />"""
content = content.replace(target1, replacement1)

# Replace CheckItemRow video preview
target2 = """            <View style={styles.videoPreview}>
              <Video size={18} color="#FFC700" />
              <Text style={styles.videoPreviewText}>Video captured</Text>
            </View>"""
replacement2 = """            <RNVideo
              source={{ uri: resolved }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              controls={true}
              paused={true}
            />"""
content = content.replace(target2, replacement2)

with open('src/screens/InspectorAddVehicleScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
