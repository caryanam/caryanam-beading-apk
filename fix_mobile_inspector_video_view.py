import re

with open('src/screens/InspectorVehicleDetailScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update engineSlots to include the video
target_engine_slots = """const engineSlots = [
  { type: 'ENGINE_IMAGE', label: 'ENGINE ROOM PHOTO' },
  { type: 'BATTERY_IMAGE', label: 'BATTERY BAY PHOTO' },
];"""

replacement_engine_slots = """const engineSlots = [
  { type: 'ENGINE_IMAGE', label: 'ENGINE ROOM PHOTO' },
  { type: 'BATTERY_IMAGE', label: 'BATTERY BAY PHOTO' },
  { type: 'Engine / Motor Noise', label: 'ENGINE NOISE VIDEO' },
];"""
content = content.replace(target_engine_slots, replacement_engine_slots)

# Update findPhoto to check inspectionVideos too
target_find_photo = """  const findPhoto = (type: string) => {
    const arr = previewData?.inspectionPhotos || [];
    return arr.find(
      (p: any) =>
        p.photoType?.toUpperCase() === type ||
        p.imageCategory?.toUpperCase().includes(type.split('_')[0]) ||
        (p.displayName || '').toUpperCase().includes(type.split('_')[0]),
    );
  };"""

replacement_find_photo = """  const findPhoto = (type: string) => {
    const isNoiseItem = type === 'Engine / Motor Noise';
    
    if (isNoiseItem) {
      const vidObj = (previewData?.inspectionVideos || []).find((v: any) => v && (v.videoUrl || v.url || v.imageUrl)) || (previewData?.videoUrl ? { videoUrl: previewData.videoUrl } : null);
      if (vidObj) return vidObj;
    }

    const arr = (previewData?.inspectionPhotos || []).concat(previewData?.inspectionVideos || []);
    return arr.find(
      (p: any) =>
        p.photoType?.toUpperCase() === type ||
        (p.imageCategory && p.imageCategory.toUpperCase().includes(type.split('_')[0])) ||
        (p.displayName && p.displayName.toUpperCase().includes(type.split('_')[0])) ||
        (p.imageCategory === type) ||
        (p.displayName === type)
    );
  };"""

content = content.replace(target_find_photo, replacement_find_photo)

# Fix renderMedia to support video properties
target_render_media_call = "{renderMedia(matched?.imageUrl, slot.label)}"
replacement_render_media_call = "{renderMedia(matched?.imageUrl || matched?.videoUrl || matched?.url, slot.label)}"
content = content.replace(target_render_media_call, replacement_render_media_call)


with open('src/screens/InspectorVehicleDetailScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
