import { useContext } from "react";
import { I18nContext } from "./context";
import type { I18nContextValue } from "./types";

export const useTranslation = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an <I18nProvider>");
  }
  return context;
};
