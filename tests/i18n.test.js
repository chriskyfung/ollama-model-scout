import { describe, it, expect } from "vitest";
import { isValidElement } from "react";
import { FEATURE_STYLES } from "@/lib/featureStyles";
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

  // Derived from the single source of truth: editing FEATURE_STYLES in
  // src/lib/featureStyles.jsx automatically updates this expectation.
  const FEATURE_ITEMS_COUNT = FEATURE_STYLES.length;
  // No code-side constant exists for this — FaqSection renders any count.
  // It is an editorial contract: every locale ships exactly 4 FAQs.
  const FAQ_ITEMS_COUNT = 4;

  // Shape guard for FEATURE_STYLES: the module has two consumers (App.jsx
  // rendering, this test's length assertion), and a malformed entry would
  // otherwise only surface as a silent visual bug in the UI.
  //
  // The expected key set is derived as the UNION of all entries' keys, so the
  // test is self-updating when the shape evolves AND catches partial edits
  // (e.g. a 5th "ring" key added to some entries but not all). Derived keys
  // cannot catch uniform decay (every entry losing the same key) — that is
  // inherent to any data-derived schema.
  it("every FEATURE_STYLES entry has an icon element and complete classes", () => {
    expect(FEATURE_STYLES.length).toBeGreaterThan(0);

    const expectedKeys = new Set(
      FEATURE_STYLES.flatMap((s) => Object.keys(s)),
    );
    // "icon" must exist in the schema; everything else is a styling class.
    expect(expectedKeys.has("icon")).toBe(true);

    FEATURE_STYLES.forEach((s) => {
      // Uniform shape: every entry carries exactly the union of keys.
      expect(new Set(Object.keys(s))).toEqual(expectedKeys);
      expect(isValidElement(s.icon)).toBe(true);
      for (const key of expectedKeys) {
        if (key === "icon") continue;
        expect(typeof s[key]).toBe("string");
        expect(s[key].length).toBeGreaterThan(0);
      }
    });
  });

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
