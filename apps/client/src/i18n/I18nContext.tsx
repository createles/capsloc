import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { SupportedLocale, TranslationKey, I18nContextValue } from "./types";
import { I18nContext } from "./context";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

const STORAGE_KEY = "capsloc:ui_language"; // stores UI default language in localStorage

const getInitialLocale = (): SupportedLocale => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ja") {
      return saved;
    }
  } catch {
    // Ignore localStorage access failures in restricted environments
  }

  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ja")) {
    return "ja";
  }

  return "en"; // Fallback to en language mode
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    // Saves locale setting to localStorage
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (err) {
      console.error("Failed to persist ui_language to localStorage:", err);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "ja")) {
        setLocaleState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage); // Add event listener to save locale changes
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const t = useCallback(
    (
      key: TranslationKey | (string & {}),
      params?: Record<string, string | number | undefined | null>,
    ): string => {
      const dictionary = locale === "ja" ? ja : en;
      const fallbackDictionary = en;

      let template: string =
        (dictionary as Record<string, string>)[key] ??
        (fallbackDictionary as Record<string, string>)[key] ??
        key;

      if (params) {
        // for parameterized string literals (e.g. mentionCounts, loc-string matches)
        for (const [paramKey, paramVal] of Object.entries(params)) {
          template = template.replaceAll(`{${paramKey}}`, paramVal != null ? String(paramVal) : "");
        }
      }

      return template;
    },
    [locale],
  );

  const contextValue = useMemo(
    (): I18nContextValue => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};
