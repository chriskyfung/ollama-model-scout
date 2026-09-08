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

/** Distinct capability tags across all models. */
export const getAvailableCapabilities = (models) =>
  Array.from(new Set(models.flatMap((m) => m.capabilities || [])));

/** Sorted distinct family values (blank/undefined dropped). */
export const getAvailableFamilies = (models) =>
  Array.from(
    new Set(models.map((m) => m.details?.family).filter(Boolean)),
  ).sort();

/**
 * Sorted distinct quantization levels, all uppercased
 * (規格需求: Quantization 全部轉大寫).
 */
export const getAvailableQuantizations = (models) =>
  Array.from(
    new Set(
      models
        .map((m) => m.details?.quantization_level?.toUpperCase())
        .filter(Boolean),
    ),
  ).sort();
