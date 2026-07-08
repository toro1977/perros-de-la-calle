import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = { uri: string; mimeType: string | null };

async function takePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? null };
}

async function pickFromGallery(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? null };
}

export function pickPhoto(): Promise<PickedPhoto | null> {
  return new Promise(resolve => {
    let settled = false;
    const resolveOnce = (value: PickedPhoto | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      'Foto',
      '¿De dónde querés sacar la foto?',
      [
        { text: 'Cámara', onPress: () => takePhoto().then(resolveOnce) },
        { text: 'Galería', onPress: () => pickFromGallery().then(resolveOnce) },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolveOnce(null) },
      ],
      // Android's back button / tap-outside dismisses without firing any
      // onPress — without this, the promise would never settle.
      { onDismiss: () => resolveOnce(null) }
    );
  });
}
