/**
 * i18next bootstrap.
 *
 * Design decisions (per project i18n plan):
 *  - Pure-frontend / static hosting: locale JSON is imported at build time so
 *    the bundle includes every language up-front. No `i18next-http-backend`.
 *  - zh-TW is the source-of-truth / fallbackLng (every other file is a delta
 *    against it).
 *  - Browser language is auto-detected via i18next-browser-languagedetector;
 *    the user's manual choice is persisted to localStorage under the key
 *    defined in LANGUAGES.js (`ollama_dashboard_lng`), overriding detector
 *    prefs on subsequent visits.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { LANGUAGES, FALLBACK_LNG, LANGUAGE_STORAGE_KEY } from "./languages";

// Statically import every locale so they are bundled (no runtime fetch).
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import zhTW from "./locales/zh-TW.json";
import zhCN from "./locales/zh-CN.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja },
  ko: { translation: ko },
  "zh-TW": { translation: zhTW },
  "zh-CN": { translation: zhCN },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Order matches the detector priority: stored choice > query > cookie > header > localStorage > navigator
    detection: {
      // Persist the user's manual choice and reuse it on later visits.
      caches: ["localStorage"],
      lookupCookie: LANGUAGE_STORAGE_KEY,
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      cachesCookie: LANGUAGE_STORAGE_KEY,
      // Ignore browser defaults once the user has explicitly chosen a language.
      excludeCookie: [LANGUAGE_STORAGE_KEY],
    },
    fallbackLng: FALLBACK_LNG,
    supportedLngs: LANGUAGES.map((l) => l.code),
    // react-i18next: suspend while a resource bundle is loading (none are lazy
    // here, but keep false to avoid blocking first paint during init).
    react: { useSuspense: false },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    // Never return the lng code in the translated output.
    returnObjects: false,
    debug: false,
  });

export default i18n;
