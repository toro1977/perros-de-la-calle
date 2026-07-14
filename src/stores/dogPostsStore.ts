import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { uploadDogPhotos } from '@/services/dogPhotoUpload';
import { PickedPhoto } from '@/services/photoPicker';
import { Database, DogPostType } from '@/types/database.types';

export type DogPostListItem = Database['public']['Functions']['list_dog_posts']['Returns'][number];
export type DogPostDetail = Database['public']['Functions']['get_dog_post']['Returns'][number];
export type MyDogPost = Database['public']['Tables']['dog_posts']['Row'];

type DogPostsState = {
  posts: DogPostListItem[];
  myPosts: MyDogPost[];
  isLoading: boolean;
};

type DogPostsActions = {
  fetchPosts: (params?: { lat?: number; lng?: number; type?: DogPostType }) => Promise<void>;
  getPost: (id: string) => Promise<DogPostDetail | null>;
  createPost: (params: {
    userId: string;
    type: DogPostType;
    photos: PickedPhoto[];
    lat: number;
    lng: number;
    zoneText: string;
    eventDate: string;
    breed: string | null;
    description: string | null;
  }) => Promise<void>;
  resolvePost: (id: string) => Promise<void>;
  fetchMyPosts: (userId: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
};

export const useDogPostsStore = create<DogPostsState & DogPostsActions>((set, get) => ({
  posts: [],
  myPosts: [],
  isLoading: false,

  fetchPosts: async params => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('list_dog_posts', {
        p_lat: params?.lat,
        p_lng: params?.lng,
        p_type: params?.type,
      });
      if (error) throw error;
      set({ posts: data ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  getPost: async id => {
    const { data, error } = await supabase.rpc('get_dog_post', { p_id: id });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  createPost: async ({ userId, type, photos, lat, lng, zoneText, eventDate, breed, description }) => {
    set({ isLoading: true });
    try {
      const photoUrls = await uploadDogPhotos(userId, photos);
      const { error } = await supabase.rpc('create_dog_post', {
        p_type: type,
        p_photo_urls: photoUrls,
        p_lat: lat,
        p_lng: lng,
        p_zone_text: zoneText,
        p_event_date: eventDate,
        p_breed: breed ?? undefined,
        p_description: description ?? undefined,
      });
      if (error) throw error;
      await get().fetchPosts({ lat, lng });
    } finally {
      set({ isLoading: false });
    }
  },

  resolvePost: async id => {
    const { error } = await supabase.from('dog_posts').update({ status: 'resolved' }).eq('id', id);
    if (error) throw error;
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
  },

  fetchMyPosts: async userId => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('dog_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ myPosts: data ?? [] });
    } finally {
      set({ isLoading: false });
    }
  },

  deletePost: async id => {
    const post = get().myPosts.find(p => p.id === id);
    // Photo paths live after the bucket name in the public URL
    // (".../object/public/dog-photos/<userId>/<file>") — storage.remove
    // wants just that "<userId>/<file>" tail.
    const paths = (post?.photo_urls ?? [])
      .map(url => url.split('/dog-photos/')[1])
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from('dog-photos').remove(paths);
    }
    const { error } = await supabase.from('dog_posts').delete().eq('id', id);
    if (error) throw error;
    set(state => ({
      myPosts: state.myPosts.filter(p => p.id !== id),
      posts: state.posts.filter(p => p.id !== id),
    }));
  },
}));
