import re

with open('src/services/inspectorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const res = await apiClient.post(`/api/inspector/inspection/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });"""

replacement = """    const res = await apiClient.post(`/api/inspector/inspection/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });"""

content = content.replace(target, replacement)

with open('src/services/inspectorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
