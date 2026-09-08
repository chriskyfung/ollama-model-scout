/**
 * Model domain helpers (pure, framework-free).
 *
 * Extracted from App.jsx so the "remote model" predicate and facet
 * computations have a single source of truth instead of being duplicated
 * across filter, batch-test, and table-render code paths.
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

/**
 * Build the performance-chart data points for the golden-inference-zone
 * chart: context steps 2K..64K clipped to the model's max context, plus the
 * max itself, deduped and ascending, each annotated with calculated perf.
 */
export const buildChartData = (selectedModel, hardware, calculatePerformance) => {
  if (!selectedModel) return [];
  const maxContext = selectedModel.details?.context_length || 131072;
  const baseSteps = [2048, 4096, 8192, 16384, 32768, 65536];
  const validSteps = baseSteps.filter((c) => c < maxContext);
  validSteps.push(maxContext);

  // 移除可能重複的數值並排序
  const uniqueSteps = Array.from(new Set(validSteps)).sort((a, b) => a - b);

  return uniqueSteps.map((c) => {
    const perf = calculatePerformance(
      c,
      hardware.vram,
      hardware.ram,
      selectedModel.details?.parameter_size,
      selectedModel.details?.quantization_level,
    );
    return {
      context: c >= 1024 ? `${Math.round(c / 1024)}K` : `${c}`,
      contextNum: c,
      ...perf,
    };
  });
};
