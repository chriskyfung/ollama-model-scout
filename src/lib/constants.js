/**
 * Centralized application constants.
 *
 * Single source of truth for:
 *  - storage keys (previously scattered as magic strings across useEffects)
 *  - default state objects (used by useState initializers)
 *  - domain constants for the performance model
 *  - UI presets
 *
 * App version is derived from package.json so it never drifts out of sync
 * with the published package version.
 */
import pkg from "/package.json";

// --- App metadata ---
export const APP_NAME = "Ollama Model Scout";
export const APP_VERSION = `v${pkg.version ?? "0.0.0"}`;
// Canonical repo URL (package.json has no `repository` field).
export const GITHUB_REPO =
  "https://github.com/chriskyfung/ollama-model-scout";

// --- Storage keys (was: 5 duplicated string literals) ---
export const STORAGE_KEYS = Object.freeze({
  apiConfig: "ollama_api_config",
  hardware: "ollama_hardware_settings",
  sortConfig: "ollama_sort_config",
  columns: "ollama_columns",
  language: "ollama_dashboard_lng", // reserved for i18n language switcher
});

// --- Domain defaults (previously inline in useState initializers) ---
export const DEFAULT_API_CONFIG = Object.freeze({
  url: "http://localhost:11434",
  key: "",
  headers: "",
});

export const DEFAULT_HARDWARE = Object.freeze({ vram: 24, ram: 64 });

export const DEFAULT_COLUMNS = Object.freeze({
  name: true,
  family: true,
  parameterSize: true,
  quantization: true,
  contextLength: true,
  size: true,
  status: true,
  capabilities: true,
  modifiedAt: true,
});

export const DEFAULT_FILTER_STATE = Object.freeze({
  type: "all",
  capabilities: [],
  families: [],
  quantizations: [],
  testStatus: "all",
});

export const DEFAULT_SORT_CONFIG = Object.freeze({ key: "name", direction: "asc" });

// --- Performance-model constants (the "LLM inference physics" magic numbers) ---
export const PERF = Object.freeze({
  GPU_BANDWIDTH: 500, // GB/s
  CPU_BANDWIDTH: 60, // GB/s
  MIN_LAYERS: 16,
  LAYER_LOG_BASE: 24,
  PARAM_LOG_BASE: 2,
  KV_HEAD_DIM: 4096,
  KV_RATIO: 2,
  KV_GQA_COMPRESSION: 8,
  WEIGHT_OVERHEAD: 1.15,
  TPS_CEILING: 120,
  TPS_EFFICIENCY: 0.85,
});

// --- UI presets ---
export const CONTEXT_PRESETS = Object.freeze({
  fast: { label: "⚡ Fast (2K)", value: 2048 },
  balanced: { label: "⚖ Balanced (8K)", value: 8192 },
});
export const CONTEXT_STEP = 2048;

// Legacy export kept so existing imports are unaffected during transition.
export const DEFAULT_FILTER_STATE_LEGACY = DEFAULT_FILTER_STATE;
