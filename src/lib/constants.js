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
