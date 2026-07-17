import { create } from 'zustand';
import { uploadDogPhotos } from '@/services/dogPhotoUpload';
import { PickedPhoto } from '@/services/photoPicker';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database.types';

export type AdoptionDogListItem = Database['public']['Functions']['list_adoption_dogs']['Returns'][number];
export type AdoptionDogDetail = Database['public']['Functions']['get_adoption_dog']['Returns'][number];
export type MyAdoptionDog = Database['public']['Tables']['adoption_dogs']['Row'];

type AdoptionDogsState = {
  dogs: AdoptionDogListItem[];
  myDogs: MyAdoptionDog[];
  isLoading: boolean;
  error: string | null;
};

type AdoptionDogsActions = {
  fetchAdoptionDogs: () => Promise<void>;
  fetchMyAdoptionDogs: (shelterId: string) => Promise<void>;
  getAdoptionDog: (id: string) => Promise<AdoptionDogDetail | null>;
  createAdoptionDog: (params: {
    photos: PickedPhoto[];
    userId: string;
    name: string;
    breed: string | null;
    description: string | null;
  }) => Promise<void>;
  updateAdoptionDog: (params: {
    id: string;
    userId: string;
    existingPhotoUrls: string[];
    newPhotos: PickedPhoto[];
    name: string;
    breed: string | null;
    description: string | null;
  }) => Promise<void>;
  updateAdoptionDogStatus: (id: string, status: string) => Promise<void>;
  deleteAdoptionDog: (id: string) => Promise<void>;
};

export const useAdoptionDogsStore = create<AdoptionDogsState & AdoptionDogsActions>((set, get) => ({
  dogs: [],
  myDogs: [],
  isLoading: false,
  error: null,

  fetchAdoptionDogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('list_adoption_dogs');
      if (error) throw error;
      set({ dogs: data ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'No pudimos cargar los perros en adopción' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyAdoptionDogs: async shelterId => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('adoption_dogs')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ myDogs: data ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'No pudimos cargar tus perros en adopción' });
    } finally {
      set({ isLoading: false });
    }
  },

  getAdoptionDog: async id => {
    const { data, error } = await supabase.rpc('get_adoption_dog', { p_id: id });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  createAdoptionDog: async ({ photos, userId, name, breed, description }) => {
    set({ isLoading: true });
    try {
      const photoUrls = await uploadDogPhotos(
        userId,
        photos.map(p => ({ uri: p.uri, mimeType: p.mimeType }))
      );
      const { error } = await supabase.rpc('create_adoption_dog', {
        p_name: name,
        p_photo_urls: photoUrls,
        p_breed: breed ?? undefined,
        p_description: description ?? undefined,
      });
      if (error) throw error;
      await get().fetchAdoptionDogs();
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdoptionDog: async ({ id, userId, existingPhotoUrls, newPhotos, name, breed, description }) => {
    set({ isLoading: true });
    try {
      const uploadedUrls =
        newPhotos.length > 0
          ? await uploadDogPhotos(
              userId,
              newPhotos.map(p => ({ uri: p.uri, mimeType: p.mimeType }))
            )
          : [];
      const photoUrls = [...existingPhotoUrls, ...uploadedUrls];
      const { error } = await supabase
        .from('adoption_dogs')
        .update({ name, breed, description, photo_urls: photoUrls })
        .eq('id', id);
      if (error) throw error;
      set(state => ({
        myDogs: state.myDogs.map(d => (d.id === id ? { ...d, name, breed, description, photo_urls: photoUrls } : d)),
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdoptionDogStatus: async (id, status) => {
    const { error } = await supabase.rpc('update_adoption_dog_status', { p_id: id, p_status: status });
    if (error) throw error;
    set(state => ({
      dogs: state.dogs.filter(d => d.id !== id),
      myDogs: state.myDogs.map(d => (d.id === id ? { ...d, status } : d)),
    }));
  },

  deleteAdoptionDog: async id => {
    const { error } = await supabase.from('adoption_dogs').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ myDogs: state.myDogs.filter(d => d.id !== id) }));
  },
}));
