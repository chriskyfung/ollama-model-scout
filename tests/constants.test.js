import { describe, it, expect } from "vitest";
import {
  APP_VERSION,
  GITHUB_REPO,
  STORAGE_KEYS,
  DEFAULT_API_CONFIG,
  DEFAULT_HARDWARE,
  HARDWARE_PRESETS,
} from "@/lib/constants";

describe("centralized constants", () => {
  it("derives app version from package.json (no drift)", () => {
    expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+/);
  });
    it("exposes the GitHub repo URL", () => {
    expect(GITHUB_REPO).toBe("https://github.com/chriskyfung/ollama-model-scout");
  });
  it("exposes the full storage key map", () => {
    expect(STORAGE_KEYS).toEqual({
      apiConfig: "ollama_api_config",
      hardware: "ollama_hardware_settings",
      sortConfig: "ollama_sort_config",
      columns: "ollama_columns",
      language: "ollama_dashboard_lng",
    });
  });
  it("freezes default objects so they stay immutable", () => {
    expect(Object.isFrozen(DEFAULT_API_CONFIG)).toBe(true);
    expect(Object.isFrozen(DEFAULT_HARDWARE)).toBe(true);
  });
  it("freezes the hardware presets and their entries", () => {
    expect(Object.isFrozen(HARDWARE_PRESETS)).toBe(true);
    HARDWARE_PRESETS.forEach((p) => expect(Object.isFrozen(p)).toBe(true));
  });
  it("exposes sane hardware presets", () => {
    expect(HARDWARE_PRESETS).toHaveLength(3);
    expect(HARDWARE_PRESETS[2]).toEqual({ id: "rtx4090", vram: 24, ram: 64 });
  });
  it("gives every hardware preset a non-empty, unique id", () => {
    // ids are used as React keys AND as i18n keys
    // (t(`apiSettings.presets.${p.id}`)), so duplicates or blanks would
    // silently break rendering/localization.
    HARDWARE_PRESETS.forEach((p) => expect(typeof p.id).toBe("string"));
    const ids = HARDWARE_PRESETS.map((p) => p.id);
    ids.forEach((id) => expect(id.length).toBeGreaterThan(0));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
