import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

/**
 * Regression test for the SVG gradient-id collision fix.
 *
 * Recharts measures its container via getBoundingClientRect + ResizeObserver,
 * both of which jsdom stubs to 0x0 — so in tests the chart renders nothing and
 * the <defs>/<linearGradient> elements never mount. We polyfill the measurement
 * APIs so the real AreaChart/gradient rendering path runs unmodified.
 */
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock;
  globalThis.ResizeObserverEntry = {};

  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 224,
    top: 0,
    left: 0,
    right: 800,
    bottom: 224,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));

  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 224,
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

const chartData = [
  { context: "8K", contextNum: 8192, memoryDemand: 10, tokensPerSecond: 40 },
];

function gradientIds() {
  return [...document.querySelectorAll("linearGradient")].map((g) => g.id);
}

describe("PerformanceChart - gradient id uniqueness", () => {
  it("two instances render with distinct gradient ids (no url(#id) collision)", () => {
    render(
      <>
        <PerformanceChart chartData={chartData} contextSlider={8192} />
        <PerformanceChart chartData={chartData} contextSlider={4096} />
      </>,
    );

    const ids = gradientIds();
    // 2 gradients (colorMemory, colorSpeed) x 2 instances = 4 total
    expect(ids).toHaveLength(4);
    // every id is unique - the core invariant the fix guarantees
    expect(new Set(ids).size).toBe(4);
  });

  it("every fill reference resolves to a gradient that actually exists in the DOM", () => {
    render(
      <>
        <PerformanceChart chartData={chartData} contextSlider={8192} />
        <PerformanceChart chartData={chartData} contextSlider={4096} />
      </>,
    );

    const ids = gradientIds();
    const fillSelector = "[fill*='url(#']";
    const fills = [...document.querySelectorAll(fillSelector)].map((el) =>
      el.getAttribute("fill"),
    );

    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      const id = fill.slice(fill.indexOf("#") + 1, -1);
      expect(ids).toContain(id);
    }
  });
});
