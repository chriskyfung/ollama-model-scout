/**
 * Model domain helpers (pure, framework-free).
 */

/**
 * Single source of truth for "is this a remote (cloud/API) model".
 * Previously duplicated 3x in App.jsx (filter, batch test, table row) —
 * keep this as the ONLY definition to avoid drift.
 */
export const isRemoteModel = (m) =>
  m.size === "remote" || m.details?.format === "api" || !!m.remote_model;

