/**
 * Canonical language registry.
 *
 * - `code` maps 1:1 to a locale file name under src/i18n/locales/.
 * - `label` is the self-describing native name shown in the language switcher
 *   (e.g. "繁體中文", "English", "日本語").
 * - The first entry is the fallback language (i18next `fallbackLng`) used when a
 *   translation key is missing and the detected language is unavailable.
 */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-CN", label: "简体中文" },
];

export const FALLBACK_LNG = LANGUAGES[0].code;
export const LANGUAGE_STORAGE_KEY = "ollama_dashboard_lng";
