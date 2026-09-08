import { useState, useEffect, useCallback, useRef } from "react";
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
 *
 * Closure-safety: `fetchModels` is wrapped in `useCallback(..., [])` so its
 * identity is stable across renders (the mount effect depends on it). To keep
 * it reading the LATEST `apiConfig`, `allowMockFallback`, `onFinally`, and `t`
 * without listing them in deps (which would change its identity and break the
 * "fetch once" contract), each is mirrored in a ref synced by a separate
 * effect. This makes the "always current" guarantee local to the hook instead
 * of depending on how every caller happens to be written.
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

  // Mirror mutable closure values in refs so fetchModels (stable identity,
  // see below) always reads the latest without listing them in its deps.
  const allowMockFallbackRef = useRef(allowMockFallback);
  const apiConfigRef = useRef(apiConfig);
  const onFinallyRef = useRef(onFinally);
  const tRef = useRef(t);

  useEffect(() => {
    allowMockFallbackRef.current = allowMockFallback;
    apiConfigRef.current = apiConfig;
    onFinallyRef.current = onFinally;
    tRef.current = t;
  }, [allowMockFallback, apiConfig, onFinally, t]);

  const fetchModels = useCallback(async (overrideFallback) => {
    const fallback =
      typeof overrideFallback === "boolean"
        ? overrideFallback
        : allowMockFallbackRef.current;
    const apiConfig = apiConfigRef.current;
    const t = tRef.current;

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
      onFinallyRef.current?.();
    }
  }, []);

  // fetchModels orchestrates API + mock-fallback and writes several slices of
  // state at once; calling it here on mount is intentional app behavior.
  // TODO(architectural): replace with React Query / an init flag when the data
  //   layer needs further promotion (e.g. shared across routes).
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

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
