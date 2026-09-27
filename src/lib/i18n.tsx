import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "hi" | "en";

type I18n = {
  lang: Lang;
  toggle: () => void;
  /** Pick the string for the current language: t("रेट", "Rates") */
  t: (hi: string, en: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

const readLang = (): Lang => {
  try {
    return localStorage.getItem("lang") === "en" ? "en" : "hi";
  } catch {
    return "hi";
  }
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(readLang);

  const toggle = () => {
    const next: Lang = lang === "hi" ? "en" : "hi";
    setLang(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      /* private mode — language just won't persist */
    }
  };

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  return <I18nContext.Provider value={{ lang, toggle, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
};
