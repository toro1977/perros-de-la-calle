import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

async function takePhoto(): Promise<string | null> {
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
  return result.canceled ? null : result.assets[0].uri;
}

async function pickFromGallery(): Promise<string | null> {
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
  return result.canceled ? null : result.assets[0].uri;
}

export function pickPhoto(): Promise<string | null> {
  return new Promise(resolve => {
    Alert.alert('Foto', '¿De dónde querés sacar la foto?', [
      { text: 'Cámara', onPress: () => takePhoto().then(resolve) },
      { text: 'Galería', onPress: () => pickFromGallery().then(resolve) },
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
