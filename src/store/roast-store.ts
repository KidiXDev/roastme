import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, RoastLevel, RoastResult } from '../types';

interface RoastState {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentLevel: RoastLevel;
  setCurrentLevel: (level: RoastLevel) => void;
  result: RoastResult | null;
  setResult: (result: RoastResult | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;
  url: string;
  setUrl: (url: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useRoastStore = create<RoastState>()(
  persist(
    (set) => ({
      language: Language.EN,
      setLanguage: (lang) => set({ language: lang }),
      currentLevel: RoastLevel.NORMAL,
      setCurrentLevel: (level) => set({ currentLevel: level }),
      result: null,
      setResult: (result) => set({ result }),
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      loadingText: '',
      setLoadingText: (text) => set({ loadingText: text }),
      url: '',
      setUrl: (url) => set({ url }),
      error: null,
      setError: (error) => set({ error })
    }),
    {
      name: 'roast-storage',
      partialize: (state) => ({
        language: state.language,
        currentLevel: state.currentLevel
      })
    }
  )
);
