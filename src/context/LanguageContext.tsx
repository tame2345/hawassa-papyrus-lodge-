import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppLang,
  SUPPORTED_LANG_CODES,
  LangDict,
  resolveText,
  tUi,
  translateRoleLabel,
  getCurrencyLabel,
} from '../i18n/translations';

interface LanguageContextValue {
  appLang: AppLang;
  setAppLang: (lang: AppLang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tText: (dict: LangDict, params?: Record<string, string | number>) => string;
  tRole: (role: string) => string;
  currency: string;
  isRtl: boolean;
}

const STORAGE_KEY = 'papyrus_app_lang';

function readInitialLang(): AppLang {
  try {
    const ls = localStorage.getItem(STORAGE_KEY);
    if (ls && (SUPPORTED_LANG_CODES as string[]).includes(ls)) {
      return ls as AppLang;
    }
    const ss = sessionStorage.getItem(STORAGE_KEY);
    if (ss && (SUPPORTED_LANG_CODES as string[]).includes(ss)) {
      return ss as AppLang;
    }
  } catch {
    // ignore storage errors
  }
  return 'am';
}

const LanguageContext = createContext<LanguageContextValue>({
  appLang: 'am',
  setAppLang: () => {},
  t: (key, params) => tUi('am', key, params),
  tText: (dict, params) => resolveText('am', dict, params),
  tRole: (role) => translateRoleLabel('am', role),
  currency: 'ብር',
  isRtl: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appLang, setAppLangState] = useState<AppLang>(readInitialLang);

  const setAppLang = useCallback((nextLang: AppLang) => {
    const valid = (SUPPORTED_LANG_CODES as string[]).includes(nextLang) ? nextLang : 'am';
    setAppLangState(valid);
    try {
      localStorage.setItem(STORAGE_KEY, valid);
      sessionStorage.setItem(STORAGE_KEY, valid);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = appLang;
    } catch {
      // ignore DOM errors
    }
  }, [appLang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => tUi(appLang, key, params),
    [appLang],
  );

  const tText = useCallback(
    (dict: LangDict, params?: Record<string, string | number>) => resolveText(appLang, dict, params),
    [appLang],
  );

  const tRole = useCallback(
    (role: string) => translateRoleLabel(appLang, role),
    [appLang],
  );

  const currency = getCurrencyLabel(appLang);
  const isRtl = appLang === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        appLang,
        setAppLang,
        t,
        tText,
        tRole,
        currency,
        isRtl,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
