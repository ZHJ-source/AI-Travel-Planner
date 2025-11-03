import { create } from 'zustand';
import { User } from '../types';
import { login, register, logout, getCurrentUser, onAuthStateChange } from '../services/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      const data = await login({ email, password });
      console.log('Login successful:', data);
      set({
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
        } : null,
        isAuthenticated: !!data.user,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (email: string, password: string) => {
    try {
      const data = await register({ email, password });
      set({
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
        } : null,
        isAuthenticated: !!data.user,
      });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await logout();
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  initialize: async () => {
    try {
      const user = await getCurrentUser();
      console.log('Initialize auth, current user:', user);
      set({
        user: user ? {
          id: user.id,
          email: user.email,
        } : null,
        isAuthenticated: !!user,
        isLoading: false,
      });
      
      // 监听认证状态变化
      onAuthStateChange((user) => {
        console.log('Auth state changed:', user);
        set({
          user: user ? {
            id: user.id,
            email: user.email,
          } : null,
          isAuthenticated: !!user,
        });
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ isLoading: false });
    }
  },
}));

