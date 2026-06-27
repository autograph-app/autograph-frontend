import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppLanguage } from '@/lib/i18n/staticDictionaries';

interface LanguageState {
  language: AppLanguage;
  dictionary: Record<string, string>;
  setLanguage: (language: AppLanguage) => void;
  setDictionary: (dictionary: Record<string, string>) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      dictionary: {},
      setLanguage: (language) => set({ language }),
      setDictionary: (dictionary) => set({ dictionary })
    }),
    {
      name: 'autograph-language'
    }
  )
);
