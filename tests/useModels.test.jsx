import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useModels } from "@/hooks/useModels";
import { MOCK_MODELS } from "@/data/models";

/**
 * Tests for the ref-based closure stabilization in useModels.
 *
 * The hook wraps fetchModels in useCallback(..., []) for a stable identity,
 * reading mutable values (allowMockFallback, apiConfig, onFinally, t) through
 * refs. These tests lock in the two invariants that makes that safe:
 *   1. fetchModels identity never changes (so the mount effect fires once).
 *   2. a bare fetchModels() call always reads the CURRENT ref value, not the
 *      stale value from the render that created the closure.
 */

describe("useModels — closure stabilization", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps fetchModels identity stable across re-renders (even when onFinally changes)", () => {
    const { result, rerender } = renderHook(
      ({ onFinally }) => useModels({ onFinally }),
      { initialProps: { onFinally: () => {} } },
    );

    const first = result.current.fetchModels;

    // Re-render several times with a fresh onFinally each time — this
    // exercises the ref-sync effect without changing fetchModels identity.
    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });

    expect(result.current.fetchModels).toBe(first);
  });

  it("fetches exactly once on mount despite re-renders", () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ models: [] }) });

    const { rerender } = renderHook(
      ({ onFinally }) => useModels({ onFinally }),
      { initialProps: { onFinally: () => {} } },
    );

    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reads the current allowMockFallback value, not the stale closure value", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderHook(
      ({ onFinally }) => useModels({ onFinally }),
      { initialProps: { onFinally: () => {} } },
    );

    // Mount-time fetch ran with allowMockFallback=true (default) → mock fallback.
    await waitFor(() => {
      expect(result.current.apiStatus.state).toBe("error");
    });
    expect(result.current.models).toEqual(MOCK_MODELS);
    expect(result.current.apiStatus.isFallback).toBe(true);

    // Toggle fallback OFF — in the old closure approach this change would be
    // invisible to the memoized fetchModels.
    act(() => result.current.setAllowMockFallback(false));

    // Re-fetch with NO override argument — must read the NOW-CURRENT value.
    await act(async () => {
      await result.current.fetchModels();
    });

    // With fallback OFF, the error path sets empty models and isFallback=false.
    expect(result.current.models).toEqual([]);
    expect(result.current.apiStatus.isFallback).toBe(false);
  });

  it("falls back to MOCK_MODELS by default when the API rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useModels());

    await waitFor(() => {
      expect(result.current.apiStatus.state).toBe("error");
    });

    expect(result.current.models).toEqual(MOCK_MODELS);
    expect(result.current.apiStatus.isFallback).toBe(true);
  });
});
