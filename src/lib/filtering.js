/**
 * Filtering + sorting pipeline for the model diagnostics table (pure).
 *
 * Extracted verbatim from App.jsx's `filteredModels` useMemo so the filter
 * semantics are unit-testable without rendering React. The only structural
 * change is that the remote-model predicate now comes from ./models.
 */
import { isRemoteModel } from "./models";

/**
 * @param {Array} models
 * @param {{searchQuery: string, filters: object, sortConfig: object, testResults: object}} cfg
 * @returns {Array} filtered + sorted models
 */
export const filterAndSortModels = (
  models,
  { searchQuery, filters, sortConfig, testResults },
) => {
  return models
    .filter((m) => {
      // 1. 全域搜尋
      const matchesSearch = JSON.stringify(m)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 2. 模型類型 (Local / Remote) 檢測 remote_model 欄位
      const isRemote = isRemoteModel(m);
      const matchesType =
        filters.type === "all"
          ? true
          : filters.type === "remote"
            ? isRemote
            : !isRemote;

      // 3. Capabilities
      const matchesCap =
        filters.capabilities.length === 0 ||
        filters.capabilities.every((c) => m.capabilities?.includes(c));

      // 4. Family
      const matchesFam =
        filters.families.length === 0 ||
        filters.families.includes(m.details?.family);

      // 5. Quantization (全部比對大寫)
      const modelQuant = m.details?.quantization_level?.toUpperCase();
      const matchesQuant =
        filters.quantizations.length === 0 ||
        filters.quantizations.includes(modelQuant);

      // 6. Test Status (API Connection)
      let matchesTest = true;
      if (filters.testStatus !== "all") {
        const res = testResults[m.name];
        if (filters.testStatus === "success")
          matchesTest = res?.status === "ok";
        else if (filters.testStatus === "error")
          matchesTest = res?.status === "error";
        else if (filters.testStatus === "untested") matchesTest = !res;
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesCap &&
        matchesFam &&
        matchesQuant &&
        matchesTest
      );
    })
    .sort((a, b) => {
      let valA, valB;

      // 支援 modified_at 排序
      if (sortConfig.key === "modified_at") {
        valA = new Date(a.modified_at || 0).getTime();
        valB = new Date(b.modified_at || 0).getTime();
      } else if (sortConfig.key === "size") {
        valA = a.size === "remote" ? -1 : a.size || 0;
        valB = b.size === "remote" ? -1 : b.size || 0;
      } else if (sortConfig.key === "status") {
        // 狀態排序權重: ok > error > untested (0)
        const weight = { ok: 2, error: 1 };
        valA = weight[testResults[a.name]?.status] || 0;
        valB = weight[testResults[b.name]?.status] || 0;
      } else if (
        [
          "family",
          "quantization_level",
          "parameter_size",
          "context_length",
        ].includes(sortConfig.key)
      ) {
        valA = a.details?.[sortConfig.key] || "";
        valB = b.details?.[sortConfig.key] || "";
        if (sortConfig.key === "quantization_level") {
          valA = String(valA).toUpperCase();
          valB = String(valB).toUpperCase();
        }
      } else {
        valA = a[sortConfig.key] || "";
        valB = b[sortConfig.key] || "";
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
};

/** 本地模型總容量計算 (remote/undefined sizes count as 0). */
export const sumLocalSize = (models) =>
  models.reduce((sum, m) => sum + (typeof m.size === "number" ? m.size : 0), 0);
