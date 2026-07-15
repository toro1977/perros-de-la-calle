import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PickedPhoto = { uri: string; mimeType: string | null };

// Full-resolution phone camera photos (often 4000px+ on the long side) can
// easily blow past the 10 MB storage limit, and there's no visible benefit
// to keeping them that large for a feed thumbnail / detail hero image.
const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.75;

async function resizeIfNeeded(
  uri: string,
  width: number,
  height: number,
  mimeType: string | null
): Promise<PickedPhoto> {
  if (Math.max(width, height) <= MAX_DIMENSION) {
    return { uri, mimeType };
  }

  const context = ImageManipulator.manipulate(uri);
  if (width >= height) {
    context.resize({ width: MAX_DIMENSION });
  } else {
    context.resize({ height: MAX_DIMENSION });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: COMPRESS_QUALITY, format: SaveFormat.JPEG });
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

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
  const asset = result.assets[0];
  return resizeIfNeeded(asset.uri, asset.width, asset.height, asset.mimeType ?? null);
}

// Multi-select from the gallery can't use allowsEditing (Expo doesn't
// support a crop step across multiple picked assets), so photos added
// this way keep their original aspect ratio.
async function pickFromGallery(selectionLimit: number): Promise<PickedPhoto[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: selectionLimit > 1,
    selectionLimit,
    quality: 0.7,
  });
  if (result.canceled) return [];
  return Promise.all(
    result.assets.map(asset => resizeIfNeeded(asset.uri, asset.width, asset.height, asset.mimeType ?? null))
  );
}

// Single selection (unlike pickFromGallery's multi-select) can use
// allowsEditing, so avatars always come back pre-cropped to a square.
async function pickSingleFromGallery(): Promise<PickedPhoto | null> {
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
  const asset = result.assets[0];
  return resizeIfNeeded(asset.uri, asset.width, asset.height, asset.mimeType ?? null);
}

export function pickAvatarPhoto(): Promise<PickedPhoto | null> {
  return new Promise(resolve => {
    let settled = false;
    const resolveOnce = (value: PickedPhoto | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      'Foto de perfil',
      '¿De dónde querés sacar la foto?',
      [
        { text: 'Cámara', onPress: () => takePhoto().then(resolveOnce) },
        { text: 'Galería', onPress: () => pickSingleFromGallery().then(resolveOnce) },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolveOnce(null) },
      ],
      { onDismiss: () => resolveOnce(null) }
    );
  });
}

export function pickPhotos(remainingSlots: number): Promise<PickedPhoto[]> {
  return new Promise(resolve => {
    let settled = false;
    const resolveOnce = (value: PickedPhoto[]) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      'Foto',
      '¿De dónde querés sacar la foto?',
      [
        { text: 'Cámara', onPress: () => takePhoto().then(p => resolveOnce(p ? [p] : [])) },
        { text: 'Galería', onPress: () => pickFromGallery(remainingSlots).then(resolveOnce) },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolveOnce([]) },
      ],
      // Android's back button / tap-outside dismisses without firing any
      // onPress — without this, the promise would never settle.
      { onDismiss: () => resolveOnce([]) }
    );
  });
}
