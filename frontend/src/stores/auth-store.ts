import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  success: string | null;
  rememberMe: boolean;
}

interface AuthActions {
  // Actions
  login: (credentials: { username: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  checkAuth: () => boolean;
  
  // State setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setRememberMe: (rememberMe: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      success: null,
      rememberMe: false,

      // Actions
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            loading: false,
            error: null,
            rememberMe: credentials.rememberMe || false,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed';
          set({
            loading: false,
            error: errorMessage,
          });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          success: null,
          rememberMe: false,
        });
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null, success: null });

        try {
          const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset email');
          }

          set({
            loading: false,
            success: data.message,
            error: null,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
          set({
            loading: false,
            error: errorMessage,
          });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
      clearSuccess: () => set({ success: null }),

      checkAuth: () => {
        const { token, user, rememberMe } = get();
        
        if (token && user) {
          set({ isAuthenticated: true });
          return true;
        }
        
        // Only clear auth if remember me is false and we're checking on page refresh
        if (!rememberMe) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
        
        set({ isAuthenticated: false });
        return false;
      },

      // State setters
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => {
        // Always persist auth data for current session
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          rememberMe: state.rememberMe,
        };
      },
      onRehydrateStorage: () => (state) => {
        // When the store is rehydrated from localStorage, check auth
        if (state) {
          state.checkAuth();
        }
      },
    }
  )
); 