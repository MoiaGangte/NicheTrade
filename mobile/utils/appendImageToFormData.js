import { Platform } from 'react-native';

export default async function appendImageToFormData(formData, fieldName, asset, fallbackName) {
  const fileName = asset.fileName || fallbackName;
  if (Platform.OS === 'web') {
    const file = asset.file || await fetch(asset.uri).then((response) => {
      if (!response.ok) throw new Error('Unable to read the selected image');
      return response.blob();
    });
    formData.append(fieldName, file, fileName);
    return;
  }

  formData.append(fieldName, {
    uri: asset.uri,
    name: fileName,
    type: asset.mimeType || 'image/jpeg',
  });
}
