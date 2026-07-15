import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Database, UserRole } from '@/types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

type AuthState = {
  session: Session | null;
  profile: UserRow | null;
  isLoading: boolean;
  isInitialized: boolean;
  /** true right after signUp when Supabase requires email confirmation before a session exists */
  confirmEmailPending: boolean;
};

type AuthActions = {
  initialize: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { fullName: string; phone: string }) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
};

// Creates the users (and shelters, if role=shelter) row the first time a
// session appears with no matching profile yet. full_name/role travel in
// the auth user's metadata (set at signUp) so this works whether the
// session appears immediately or later, after email confirmation.
//
// signIn/signUp call this directly AND onAuthStateChange's SIGNED_IN
// listener calls it again for the same session — both can race on the
// same first-login. upsert + ignoreDuplicates makes that race harmless
// (the loser's insert becomes a no-op instead of a unique-violation
// error) instead of trying to dedupe the two call sites.
async function ensureProfile(session: Session) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle();
  if (existing) return;

  const fullName = (session.user.user_metadata.full_name as string | undefined) ?? '';
  const phone = (session.user.user_metadata.phone as string | undefined) ?? null;
  const role = (session.user.user_metadata.role as UserRole | undefined) ?? 'individual';

  const { error: userError } = await supabase
    .from('users')
    .upsert(
      {
        id: session.user.id,
        email: session.user.email!,
        full_name: fullName,
        phone,
        role,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (userError) throw userError;

  if (role === 'shelter') {
    const { error: shelterError } = await supabase
      .from('shelters')
      .upsert({ id: session.user.id, shelter_name: fullName }, { onConflict: 'id', ignoreDuplicates: true });
    if (shelterError) throw shelterError;
  }
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  confirmEmailPending: false,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session });
    if (session) {
      await ensureProfile(session);
      await get().refreshProfile();
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      set({ session: newSession });
      if (newSession) {
        await ensureProfile(newSession);
        await get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });

    set({ isInitialized: true });
  },

  signUpWithEmail: async (email, password, fullName, phone, role) => {
    set({ isLoading: true, confirmEmailPending: false });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, role }, emailRedirectTo: 'perrosdelacalle://' },
      });
      if (error) throw error;

      // Supabase returns a 200 with an empty `identities` array (instead of
      // an error) when the email is already registered — it does this on
      // purpose, to avoid leaking which emails exist to an attacker.
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('Ya existe una cuenta con este email. Iniciá sesión en vez de crear una nueva.');
      }

      if (data.session) {
        set({ session: data.session });
        await ensureProfile(data.session);
        await get().refreshProfile();
      } else {
        // email confirmation required — no session until the user confirms
        set({ confirmEmailPending: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ session: data.session });
      await ensureProfile(data.session);
      await get().refreshProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ session: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session) return;
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    set({ profile: data ?? null });
  },

  updateProfile: async ({ fullName, phone }) => {
    const { session } = get();
    if (!session) return;
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, phone })
        .eq('id', session.user.id);
      if (error) throw error;
      await get().refreshProfile();
    } finally {
      set({ isLoading: false });
    }
  },

  updateAvatar: async avatarUrl => {
    const { session } = get();
    if (!session) return;
    const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', session.user.id);
    if (error) throw error;
    await get().refreshProfile();
  },
}));
