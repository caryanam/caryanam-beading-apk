import re

with open('src/screens/InspectorAddVehicleScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(<View style=\{\[styles\.checkItem, \{ borderColor: error \? '#F43F5E' : colors\.border, backgroundColor: isDark \? '#171A24' : '#F2F4FA' \]\}>)(.*?)(      </View>\n    \);\n  \};)"

replacement = """<View style={[styles.checkItem, { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
        <View style={styles.checkItemRow}>
          <Text style={[styles.checkItemName, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
            {label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PickerFieldMini
              value={value}
              options={options}
              onSelect={onValueChange}
              colors={colors}
            />
            {!resolved && !isNa && (
              <TouchableOpacity
                style={[
                  styles.checkItemUploadMini,
                  { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
                ]}
                onPress={onPick}
                disabled={uploading}
                activeOpacity={0.85}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFC700" />
                ) : (
                  isVideo ? <Video size={16} color="#FFC700" /> : <Camera size={16} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            )}
            {!resolved && isNa && (
              <View style={styles.naTagMini}>
                <Text style={styles.naTagMiniText}>N/A</Text>
              </View>
            )}
          </View>
        </View>

        {resolved ? (
          <View style={[styles.checkItemPreview, { borderColor: colors.border, marginTop: 10 }]}>
            {isVideo || isVideoUrl(resolved) ? (
              <RNVideo
                source={{ uri: resolved }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                controls={true}
                paused={true}
              />
            ) : (
              <Image source={{ uri: resolved }} style={styles.checkItemPreviewImg} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemove} activeOpacity={0.85}>
              <Trash2 size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
        
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      </View>
    );
  };"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/screens/InspectorAddVehicleScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
