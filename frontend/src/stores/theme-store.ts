import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
); 