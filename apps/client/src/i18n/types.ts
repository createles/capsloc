import type { en } from "./locales/en";

export type SupportedLocale = "en" | "ja";

export type TranslationKey = keyof typeof en;

export interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (
    key: TranslationKey | (string & {}), // the text identifier key (e.g "header.studioSubtitle")
    params?: Record<string, string | number | undefined | null>,
  ) => string;
}
