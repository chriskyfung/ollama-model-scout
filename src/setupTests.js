/**
 * Global test setup for Vitest (jsdom).
 * Mirrors the minimal expectations of the React component tests: a DOM and
 * a mocked matchMedia used by some Tailwind animations.
 */
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en.json";

// Initialize i18n for tests with a fixed language (English) to ensure
// deterministic assertions on translated strings.
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["translation"],
  defaultNS: "translation",
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// jsdom does not implement matchMedia; provide a silent mock.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false,
  })),
});

afterEach(() => {
  vi.restoreAllMocks();
});
