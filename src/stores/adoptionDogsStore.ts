import { create } from 'zustand';
import { uploadDogPhoto } from '@/services/dogPhotoUpload';
import { PickedPhoto } from '@/services/photoPicker';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database.types';

export type AdoptionDogListItem = Database['public']['Functions']['list_adoption_dogs']['Returns'][number];
export type AdoptionDogDetail = Database['public']['Functions']['get_adoption_dog']['Returns'][number];

type AdoptionDogsState = {
  dogs: AdoptionDogListItem[];
  isLoading: boolean;
  error: string | null;
};

type AdoptionDogsActions = {
  fetchAdoptionDogs: () => Promise<void>;
  getAdoptionDog: (id: string) => Promise<AdoptionDogDetail | null>;
  createAdoptionDog: (params: {
    photo: PickedPhoto;
    userId: string;
    name: string;
    breed: string | null;
    description: string | null;
  }) => Promise<void>;
  updateAdoptionDogStatus: (id: string, status: string) => Promise<void>;
};

export const useAdoptionDogsStore = create<AdoptionDogsState & AdoptionDogsActions>((set, get) => ({
  dogs: [],
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

  getAdoptionDog: async id => {
    const { data, error } = await supabase.rpc('get_adoption_dog', { p_id: id });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  createAdoptionDog: async ({ photo, userId, name, breed, description }) => {
    set({ isLoading: true });
    try {
      const photoUrl = await uploadDogPhoto(userId, photo.uri, photo.mimeType);
      const { error } = await supabase.rpc('create_adoption_dog', {
        p_name: name,
        p_photo_url: photoUrl,
        p_breed: breed ?? undefined,
        p_description: description ?? undefined,
      });
      if (error) throw error;
      await get().fetchAdoptionDogs();
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdoptionDogStatus: async (id, status) => {
    const { error } = await supabase.rpc('update_adoption_dog_status', { p_id: id, p_status: status });
    if (error) throw error;
    set(state => ({ dogs: state.dogs.filter(d => d.id !== id) }));
  },
}));
