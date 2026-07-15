import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

// avatars bucket only allows these (see
// supabase/migrations/20260715000001_avatars_storage_bucket.sql).
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

export async function uploadAvatar(userId: string, photoUri: string, mimeType: string | null = null) {
  const contentType = resolveContentType(mimeType, photoUri);
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  // Fixed filename (no timestamp) — each new upload just overwrites the
  // previous one instead of piling up orphaned avatars per user.
  const fileName = `${userId}/avatar.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage.from('avatars').upload(fileName, decode(base64), {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName);
  // Public URLs get cached aggressively (by the CDN and by <Image/>) — a
  // cache-busting query param makes a re-uploaded avatar actually show
  // the new image instead of the stale cached one.
  return `${publicUrl}?t=${Date.now()}`;
}
