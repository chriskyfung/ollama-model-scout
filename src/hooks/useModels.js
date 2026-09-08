import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MOCK_MODELS } from "@/data/models";
import { STORAGE_KEYS, DEFAULT_API_CONFIG } from "@/lib/constants";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * Data-layer hook: API connection config + model list + connection status.
 *
 * Owns the fetch → parse → fallback-to-mock pipeline. Previously inline in
 * App.jsx; extracted so App is a pure composition. Semantics preserved:
 *  - fetch runs exactly ONCE on mount (intentional "fetch once" behavior —
 *    do NOT add apiConfig to the effect deps; the apply/retry buttons
 *    re-trigger fetchModels explicitly).
 *  - `overrideFallback` lets the ConnectionBanner toggle re-fetch directly.
 *  - `onFinally` (called in the original `finally` block) preserves the
 *    resetFilters-after-fetch ordering without coupling filter state here.
 */
export function useModels({ onFinally } = {}) {
  const { t } = useTranslation();
  const [apiConfig, setApiConfig] = useLocalStorage(
    STORAGE_KEYS.apiConfig,
    DEFAULT_API_CONFIG,
  );
  const [apiStatus, setApiStatus] = useState({
    state: "idle",
    message: "",
    isFallback: false,
  });
  const [allowMockFallback, setAllowMockFallback] = useState(true);
  const [models, setModels] = useState(MOCK_MODELS);

  const fetchModels = async (overrideFallback) => {
    const fallback =
      typeof overrideFallback === "boolean"
        ? overrideFallback
        : allowMockFallback;
    setApiStatus({
      state: "loading",
      message: t("toast.connecting"),
      isFallback: false,
    });
    try {
      let customHeaders = {};
      if (apiConfig.headers) {
        try {
          customHeaders = JSON.parse(apiConfig.headers);
        } catch {
          throw new Error(t("toast.headersError"));
        }
      }

      const headers = {
        "Content-Type": "application/json",
        ...(apiConfig.key ? { Authorization: `Bearer ${apiConfig.key}` } : {}),
        ...customHeaders,
      };

      const res = await fetch(`${apiConfig.url}/api/tags`, {
        method: "GET",
        headers,
      });

      if (!res.ok) throw new Error(t("toast.httpError", { status: res.status }));

      const data = await res.json();
      if (data && Array.isArray(data.models)) {
        setModels(data.models);
        setApiStatus({
          state: "success",
          message: t("toast.success", { count: data.models.length }),
          isFallback: false,
        });
      } else {
        throw new Error(t("toast.responseError"));
      }
    } catch (err) {
      if (fallback) {
        setModels(MOCK_MODELS);
        setApiStatus({
          state: "error",
          message: t("toast.fallback", { error: err.message }),
          isFallback: true,
        });
      } else {
        setModels([]);
        setApiStatus({
          state: "error",
          message: t("toast.failed", { error: err.message }),
          isFallback: false,
        });
      }
    } finally {
      onFinally?.();
    }
  };

  // fetchModels orchestrates API + mock-fallback and writes several slices of
  // state at once; calling it here on mount is intentional app behavior.
  // TODO(architectural): replace with React Query / an init flag when the data
  //   layer needs further promotion (e.g. shared across routes).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchModels is the data-sync boundary on mount
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount (intentional)
  }, []);

  return {
    apiConfig,
    setApiConfig,
    apiStatus,
    allowMockFallback,
    setAllowMockFallback,
    models,
    fetchModels,
  };
}
