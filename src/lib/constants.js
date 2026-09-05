/**
 * Centralized application constants.
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
