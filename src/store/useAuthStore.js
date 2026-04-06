import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      
      setSession: (session) => set({ 
        user: session?.user || null, 
        session: session || null,
        isLoading: false
      }),
      
      login: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ isLoading: false });
          throw error;
        }
        return data;
      },

      register: async (email, password, nombre) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombre
            }
          }
        });
        if (error) {
          set({ isLoading: false });
          throw error;
        }
        return data;
      },

      logout: async () => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signOut();
        if (error) {
          set({ isLoading: false });
          throw error;
        }
        set({ user: null, session: null, isLoading: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);
