import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useModels } from "@/hooks/useModels";
import { MOCK_MODELS } from "@/data/models";

/**
 * Tests for the ref-based closure stabilization in useModels.
 *
 * The hook wraps fetchModels in useCallback(..., []) for a stable identity,
 * reading mutable values (allowMockFallback, apiConfig, onFinally, t) through
 * refs — and (per the effect-ordering contract in useModels.js) always reads
 * the CURRENT ref value at call time, never a stale closure value.
 */

// Small helper to cut the renderHook(useModels({ onFinally })) boilerplate.
// Exposes the RTL result so tests can call fetchModels/setters and re-render
// with a fresh onFinally when their assertion depends on it.
function renderUseModels(onFinally = () => {}) {
  return renderHook(({ onFinally: cb }) => useModels({ onFinally: cb }), {
    initialProps: { onFinally },
  });
}

describe("useModels — closure stabilization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps fetchModels identity stable across re-renders (even when onFinally changes)", () => {
    const { result, rerender } = renderUseModels();

    const first = result.current.fetchModels;

    // Re-render several times with a fresh onFinally each time — this
    // exercises the ref-sync effect without changing fetchModels identity.
    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });

    expect(result.current.fetchModels).toBe(first);
  });

  it("fetches exactly once on mount despite re-renders", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ models: [] }) });

    const { rerender } = renderUseModels();

    rerender({ onFinally: () => {} });
    rerender({ onFinally: () => {} });

    // Await the mount fetch settling before asserting, so the count is stable
    // (avoids a theoretical race vs. the async effect completing later).
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("reads the current allowMockFallback value, not the stale closure value", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderUseModels();

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

    const { result } = renderUseModels();

    await waitFor(() => {
      expect(result.current.apiStatus.state).toBe("error");
    });

    expect(result.current.models).toEqual(MOCK_MODELS);
    expect(result.current.apiStatus.isFallback).toBe(true);
  });

  it("fetchModels(false) forces fallback OFF regardless of current allowMockFallback", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderUseModels();

    // Gate on the mount-triggered fetch settling first, so the explicit call
    // below is unambiguously the source of the final state (matches test 3).
    await waitFor(() => {
      expect(result.current.apiStatus.state).toBe("error");
    });

    // allowMockFallback defaults to true, but an explicit false overrides it:
    // the failure path must yield empty models, not the mock data.
    await act(async () => {
      await result.current.fetchModels(false);
    });

    expect(result.current.models).toEqual([]);
    expect(result.current.apiStatus.isFallback).toBe(false);
  });

  it("fetchModels(true) forces fallback ON even after allowMockFallback was turned off", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { result } = renderUseModels();

    // Gate on the mount-triggered fetch settling first (see test 5).
    await waitFor(() => {
      expect(result.current.apiStatus.state).toBe("error");
    });

    act(() => result.current.setAllowMockFallback(false));

    // Current state is fallback-OFF, but the explicit true override wins.
    await act(async () => {
      await result.current.fetchModels(true);
    });

    expect(result.current.models).toEqual(MOCK_MODELS);
    expect(result.current.apiStatus.isFallback).toBe(true);
  });
});
