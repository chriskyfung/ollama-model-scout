import { describe, it, expect } from "vitest";
import en from "@/i18n/locales/en.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import zhCN from "@/i18n/locales/zh-CN.json";
import ja from "@/i18n/locales/ja.json";
import ko from "@/i18n/locales/ko.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import de from "@/i18n/locales/de.json";

/**
 * Recursively collects all leaf-key paths (e.g. "nav.models", "faq.item1.q")
 * from a locale object. Used to verify that every language JSON has the same
 * key structure as the English base.
 */
function collectKeys(obj, prefix = "", out = []) {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      collectKeys(obj[key], path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

const LOCALES = {
  en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  es,
  fr,
  de,
};

describe("i18n locale parity", () => {
  const enKeys = collectKeys(en).sort();

  it("English base has at least 50 keys (sanity check)", () => {
    expect(enKeys.length).toBeGreaterThan(50);
  });

  for (const [code, locale] of Object.entries(LOCALES)) {
    it(`${code} has the same key structure as en`, () => {
      const keys = collectKeys(locale).sort();
      expect(keys).toEqual(enKeys);
    });
  }
});
