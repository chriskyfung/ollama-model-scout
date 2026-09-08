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
 * Recursively collects all leaf-key paths (e.g. "nav.models", "faq.items")
 * from a locale object. Used to verify that every language JSON has the same
 * key structure as the English base.
 *
 * NOTE: arrays are treated as leaves (NOT descended into), so this test
 * cannot detect changes to array contents/length — that's covered by the
 * "locale array contracts" tests below.
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

describe("locale array contracts", () => {
  // Arrays are opaque leaves to the parity test above, so the positional
  // contracts below are enforced here instead.

  const FEATURE_ITEMS_COUNT = 4; // must match FEATURE_STYLES.length in src/App.jsx
  const FAQ_ITEMS_COUNT = 4; // ids are used as DOM ids in FaqSection (a11y tests rely on them)

  const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

  for (const [code, locale] of Object.entries(LOCALES)) {
    it(`${code} features.items has ${FEATURE_ITEMS_COUNT} complete entries`, () => {
      const items = locale.features.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(FEATURE_ITEMS_COUNT);
      items.forEach((item) => {
        expect(isNonEmptyString(item.title)).toBe(true);
        expect(isNonEmptyString(item.desc)).toBe(true);
      });
    });

    it(`${code} faq.items has ${FAQ_ITEMS_COUNT} complete entries with unique ids`, () => {
      const items = locale.faq.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(FAQ_ITEMS_COUNT);
      const ids = items.map((item) => item.id);
      ids.forEach((id) => expect(isNonEmptyString(id)).toBe(true));
      expect(new Set(ids).size).toBe(ids.length);
      items.forEach((item) => {
        expect(isNonEmptyString(item.q)).toBe(true);
        expect(isNonEmptyString(item.a)).toBe(true);
      });
    });
  }
});
