import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, AuthActions, User } from '@/types/auth';

interface HydrationState {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions & HydrationState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (status: boolean) => set({ isAuthenticated: status }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
