/**
 * Pure formatting helpers.
 *
 * Deliberately stateless and framework-free so they can be unit-tested in
 * isolation and reused by future i18n formatters.
 *
 * NOTE: These preserve the EXACT output of the original App.jsx formatters to
 * avoid any visible regression in table labels. `filesize` is available in the
 * dependency tree for a future switch to IEC units (e.g. KiB/MiB) but is not
 * used here yet so the diff stays a pure refactor.
 */

/**
 * Format a byte count for display.
 * Mirrors the original: 1024-base, 2 decimals, "B"/"KB"/"MB"/"GB"/"TB".
 */
export const formatBytes = (bytes) => {
  if (bytes === "remote") return "Cloud";
  if (!bytes || Number.isNaN(Number(bytes))) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Format a parameter-size string ("70B", "1.1B", "100M") OR a raw numeric
 * billion-count into a compact display string.
 *
 * Behavior matches the original App.jsx precisely, because model parameter
 * sizes from the Ollama API (and mock data) already carry their own unit
 * suffix ("70B", "500M"); we only do magnitude scaling for bare numbers.
 * These strings are dynamic API data, NOT i18n keys (per the i18n plan).
 */
export const formatParameterSize = (paramStr) => {
  if (!paramStr || paramStr === "Cloud") return paramStr || "-";
  if (!/^\d+(?:\.\d+)?$/.test(String(paramStr))) return String(paramStr); // e.g. "70B" → "70B"

  const sizes = ["", "K", "M", "B", "T"];
  const i = Math.floor(Math.log10(paramStr) / 3);
  return parseFloat((paramStr / Math.pow(10, 3 * i)).toFixed(2)) + sizes[i];
};

export const isDigit = (val) =>
  val !== null && val !== undefined && /^\d+(?:\.\d+)?$/.test(String(val));

