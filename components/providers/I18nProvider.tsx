'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { staticDictionaries, type AppLanguage } from '@/lib/i18n/staticDictionaries';

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5036';

const normalizeLanguage = (value?: string | null): AppLanguage | null => {
  if (!value) {
    return null;
  }

  const languageCode = value.toLowerCase();
  if (languageCode.startsWith('tr')) {
    return 'tr';
  }

  if (languageCode.startsWith('en')) {
    return 'en';
  }

  return null;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((s) => s.language);
  const dictionary = useLanguageStore((s) => s.dictionary);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const setDictionary = useLanguageStore((s) => s.setDictionary);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedState = window.localStorage.getItem('autograph-language');
    const hasPersistedPreference = storedState !== null;

    const userPreferredLanguage = normalizeLanguage(user?.preferredLanguage);
    if (userPreferredLanguage && userPreferredLanguage !== language) {
      setLanguage(userPreferredLanguage);
      return;
    }

    if (!hasPersistedPreference) {
      const browserLanguage = normalizeLanguage(
        window.navigator.languages?.[0] || window.navigator.language
      ) ?? 'en';

      if (browserLanguage !== language) {
        setLanguage(browserLanguage);
      }
    }
  }, [language, setLanguage, user?.preferredLanguage]);

  useEffect(() => {
    let ignore = false;

    const loadDictionary = async () => {
      const base = staticDictionaries[language];

      try {
        const response = await fetch(`${API_URL}/api/v1/resources/dictionary?culture=${language}`);
        const json = await response.json();
        const remote = json?.data ?? {};

        if (!ignore) {
          setDictionary({ ...base, ...remote });
        }
      } catch {
        if (!ignore) {
          setDictionary(base);
        }
      }
    };

    void loadDictionary();
    document.documentElement.lang = language;

    return () => {
      ignore = true;
    };
  }, [language, setDictionary]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, params) => {
      const template = dictionary[key] ?? staticDictionaries[language][key] ?? key;
      if (!params) {
        return template;
      }

      return Object.entries(params).reduce(
        (current, [paramKey, paramValue]) => current.replaceAll(`{${paramKey}}`, paramValue),
        template
      );
    }
  }), [dictionary, language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
