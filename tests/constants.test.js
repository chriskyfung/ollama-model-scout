import { describe, it, expect } from "vitest";
import {
  APP_VERSION,
  GITHUB_REPO,
  STORAGE_KEYS,
  DEFAULT_API_CONFIG,
  DEFAULT_HARDWARE,
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
});
