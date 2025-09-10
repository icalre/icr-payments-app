import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  session: Session | null;
  initializing: boolean;
  error?: string | null;
  signInWithPassword: (params: { email: string; password: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      initializing: true,
      error: null,
      isLoading: false,
      isAuthenticated: false,
      async signInWithPassword({ email, password }) {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ error: error.message, isLoading: false });
          return { error: error.message };
        }
        set({
          user: data.user,
          session: data.session,
          error: null,
          isLoading: false,
          isAuthenticated: true,
        });
        return {};
      },
      async signOut() {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ user: null, session: null, error: null, isLoading: false, isAuthenticated: false });
      },
      async refreshSession() {
        set({ isLoading: true });
        const { data } = await supabase.auth.getSession();
        set({
          session: data.session ?? null,
          user: data.session?.user ?? null,
          isLoading: false,
          isAuthenticated: true,
        });
      },
      async checkAuth() {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          set({ user: null, session: null, isLoading: false });
          return false;
        }
        const isAuth = !!data.session?.user;
        set({
          session: data.session ?? null,
          user: data.session?.user ?? null,
          isLoading: false,
          isAuthenticated: isAuth,
        });
        return isAuth;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Initialize auth state and listener once when this module is imported
(async () => {
  const { data } = await supabase.auth.getSession();
  useAuth.setState({
    session: data.session ?? null,
    user: data.session?.user ?? null,
    initializing: false,
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session: session ?? null, user: session?.user ?? null, isLoading: false });
  });
})();
