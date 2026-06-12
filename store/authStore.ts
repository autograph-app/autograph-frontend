import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  userName: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  accountType: number; // 0: Fan, 1: Artist, 2: Admin
  isVerified: boolean;
  isPremium: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'autograph-auth',
    }
  )
);
