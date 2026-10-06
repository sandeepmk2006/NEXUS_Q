import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  name?: string;
  photoURL?: string;
  role: 'doctor' | 'admin';
  specialization?: string;
  licenseNumber?: string;
  hospital?: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => {
        const enrichedUser = user ? { ...user, name: user.displayName || user.name || user.email.split('@')[0] } : null;
        set({ user: enrichedUser, isAuthenticated: !!enrichedUser, isLoading: false });
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'nexusq-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
