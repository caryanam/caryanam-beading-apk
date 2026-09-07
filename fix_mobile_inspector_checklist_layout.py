import re

with open('src/screens/InspectorAddVehicleScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix ChecklistItem layout to match Web (circular button next to picker)
target_checklist_item = """      <View style={[styles.checkItem, { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
        <View style={styles.checkItemRow}>
          <Text style={[styles.checkItemName, { color: colors.foreground }]} numberOfLines={1}>
            {label}
          </Text>
          <PickerFieldMini
            value={value}
            options={options}
            onSelect={onValueChange}
            colors={colors}
          />
        </View>

        {resolved ? (
          <View style={[styles.checkItemPreview, { borderColor: colors.border }]}>
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
        ) : (
          !isNa && (
            <TouchableOpacity
              style={[styles.checkItemUpload, { borderColor: error ? '#F43F5E' : 'rgba(148,163,184,0.35)' }]}
              onPress={onPick}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFC700" />
              ) : (
                <>
                  {isVideo ? <Video size={15} color="#FFC700" /> : <Camera size={15} color="#FFC700" />}
                  <Text style={[styles.checkItemUploadText, { color: colors.mutedForeground }]}>
                    {isVideo ? 'Upload video' : 'Upload photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )
        )}
        {isNa && (
          <Text style={styles.naTag}>N/A (No Photo)</Text>
        )}
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      </View>"""

replacement_checklist_item = """      <View style={[styles.checkItem, { borderColor: error ? '#F43F5E' : colors.border, backgroundColor: isDark ? '#171A24' : '#F2F4FA' }]}>
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
      </View>"""
content = content.replace(target_checklist_item, replacement_checklist_item)

# Also add checkItemUploadMini style
target_styles = """  checkItemUploadText: {"""
replacement_styles = """  checkItemUploadMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  naTagMini: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  naTagMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  checkItemUploadText: {"""
content = content.replace(target_styles, replacement_styles)

with open('src/screens/InspectorAddVehicleScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
