import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import gu from './gu.js';

const DICTS = { en, gu };
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sq_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('sq_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key, params) => {
      const v = DICTS[lang][key] ?? en[key];
      if (v === undefined) return key;
      return typeof v === 'function' ? v(params || {}) : v;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Pick the right name field for the current language. */
export function useNames() {
  const { lang } = useLang();
  return {
    service: (s) => (lang === 'gu' ? s.nameGu : s.nameEn),
    barber: (b) => (b ? (lang === 'gu' ? b.nameGu : b.name) : ''),
  };
}
