import { useState, useMemo } from "react";
import {
  STORAGE_KEYS,
  DEFAULT_FILTER_STATE,
  DEFAULT_SORT_CONFIG,
  DEFAULT_COLUMNS,
} from "@/lib/constants";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  getAvailableCapabilities,
  getAvailableFamilies,
  getAvailableQuantizations,
} from "@/lib/models";
import { filterAndSortModels, sumLocalSize } from "@/lib/filtering";

/**
 * UI-state hook for the diagnostics table: search, filters, sort, and column
 * visibility + the derived (filtered/sorted) model list and its local-size
 * sum.
 *
 * `testResults` is owned by useModelTesting and passed in so test-status
 * filtering participates in the memo pipeline (exactly as in the original
 * App.jsx where the useMemo depended on testResults).
 */
export function useModelFilters(models, testResults) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTER_STATE);
  const [sortConfig, setSortConfig] = useLocalStorage(
    STORAGE_KEYS.sortConfig,
    DEFAULT_SORT_CONFIG,
  );
  const [columns, setColumns] = useLocalStorage(
    STORAGE_KEYS.columns,
    DEFAULT_COLUMNS,
  );

  const resetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
  };

  const toggleFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const sortTable = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const availableCapabilities = useMemo(
    () => getAvailableCapabilities(models),
    [models],
  );
  const availableFamilies = useMemo(
    () => getAvailableFamilies(models),
    [models],
  );
  const availableQuantizations = useMemo(
    () => getAvailableQuantizations(models),
    [models],
  );

  const filteredModels = useMemo(
    () =>
      filterAndSortModels(models, {
        searchQuery,
        filters,
        sortConfig,
        testResults,
      }),
    [models, searchQuery, filters, sortConfig, testResults],
  );

  const totalLocalSize = useMemo(
    () => sumLocalSize(filteredModels),
    [filteredModels],
  );

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters,
    toggleFilter,
    sortConfig,
    sortTable,
    columns,
    setColumns,
    availableCapabilities,
    availableFamilies,
    availableQuantizations,
    filteredModels,
    totalLocalSize,
  };
}
