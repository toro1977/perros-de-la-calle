import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

export async function uploadDogPhoto(userId: string, photoUri: string) {
  const rawExt = (photoUri.split('.').pop() ?? 'jpg').toLowerCase();
  const ext = rawExt === 'jpg' ? 'jpeg' : rawExt;
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { error } = await supabase.storage
    .from('dog-photos')
    .upload(fileName, decode(base64), { contentType: `image/${ext}` });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('dog-photos').getPublicUrl(fileName);
  return publicUrl;
}
