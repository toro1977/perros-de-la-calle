import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database.types';

export type ShelterRow = Database['public']['Tables']['shelters']['Row'];

type ShelterProfileInput = {
  shelterName: string;
  locality: string;
  contactWhatsapp: string;
  socialLinks: string;
  bio: string;
};

type DonationInput = {
  donationAlias: string | null;
  donationCbu: string | null;
  donationMpLink: string | null;
};

type ShelterState = {
  shelter: ShelterRow | null;
  isLoading: boolean;
  error: string | null;
};

type ShelterActions = {
  fetchMyShelter: (userId: string) => Promise<void>;
  // Upsert with verification_status reset to 'pending' — this is the only
  // action that touches verification_status from the client (reviewed_by/at
  // stay admin-only, set manually per the approval process in docs/).
  requestVerification: (userId: string, data: ShelterProfileInput) => Promise<void>;
  // Edits the shelter's own fields (incl. donation display data) without
  // touching verification_status — used both while pending/rejected and
  // after approval.
  updateShelterProfile: (userId: string, data: ShelterProfileInput & DonationInput) => Promise<void>;
};

export const useShelterStore = create<ShelterState & ShelterActions>((set, get) => ({
  shelter: null,
  isLoading: false,
  error: null,

  fetchMyShelter: async userId => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('shelters').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      set({ shelter: data ?? null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'No pudimos cargar tu perfil de refugio' });
    } finally {
      set({ isLoading: false });
    }
  },

  requestVerification: async (userId, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('shelters').upsert(
        {
          id: userId,
          shelter_name: data.shelterName,
          locality: data.locality,
          contact_whatsapp: data.contactWhatsapp,
          social_links: data.socialLinks,
          bio: data.bio,
          verification_status: 'pending',
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      await get().fetchMyShelter(userId);
    } finally {
      set({ isLoading: false });
    }
  },

  updateShelterProfile: async (userId, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('shelters')
        .update({
          shelter_name: data.shelterName,
          locality: data.locality,
          contact_whatsapp: data.contactWhatsapp,
          social_links: data.socialLinks,
          bio: data.bio,
          donation_alias: data.donationAlias,
          donation_cbu: data.donationCbu,
          donation_mp_link: data.donationMpLink,
        })
        .eq('id', userId);
      if (error) throw error;
      await get().fetchMyShelter(userId);
    } finally {
      set({ isLoading: false });
    }
  },
}));
