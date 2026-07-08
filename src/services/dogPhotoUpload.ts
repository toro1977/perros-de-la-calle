import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

// dog-photos bucket only allows these (see supabase/migrations/20260706000010_storage.sql).
// image/jpeg is the safe fallback — camera/gallery photos are always re-encodable to it,
// and both the picker's mimeType and a URI-extension guess can come back empty/unexpected
// (e.g. content:// URIs with no extension, or formats like HEIC the bucket doesn't allow).
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function resolveContentType(mimeType: string | null, photoUri: string): string {
  if (mimeType && ALLOWED_CONTENT_TYPES[mimeType]) return mimeType;

  const rawExt = (photoUri.split('.').pop() ?? '').toLowerCase();
  const guessed = rawExt === 'jpg' ? 'image/jpeg' : `image/${rawExt}`;
  if (ALLOWED_CONTENT_TYPES[guessed]) return guessed;

  return 'image/jpeg';
}

export async function uploadDogPhoto(userId: string, photoUri: string, mimeType: string | null = null) {
  const contentType = resolveContentType(mimeType, photoUri);
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage.from('dog-photos').upload(fileName, decode(base64), { contentType });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('dog-photos').getPublicUrl(fileName);
  return publicUrl;
}
