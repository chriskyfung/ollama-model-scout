import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import PerformanceChart from "@/components/dashboard/PerformanceChart";

const chartData = [
  {
    context: "8K",
    contextNum: 8192,
    memoryDemand: 10,
    tokensPerSecond: 40,
  },
];

const originalResizeObserver = globalThis.ResizeObserver;
const originalResizeObserverEntry = globalThis.ResizeObserverEntry;
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock;
  globalThis.ResizeObserverEntry = class ResizeObserverEntryMock {};

  Object.defineProperty(Element.prototype, "getBoundingClientRect", {
    configurable: true,
    value() {
      return {
        width: 800,
        height: 224,
        top: 0,
        left: 0,
        right: 800,
        bottom: 224,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      };
    },
  });

  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 800,
  });

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 224,
  });
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  if (originalResizeObserver) {
    globalThis.ResizeObserver = originalResizeObserver;
  } else {
    delete globalThis.ResizeObserver;
  }

  if (originalResizeObserverEntry) {
    globalThis.ResizeObserverEntry = originalResizeObserverEntry;
  } else {
    delete globalThis.ResizeObserverEntry;
  }

  Object.defineProperty(Element.prototype, "getBoundingClientRect", {
    configurable: true,
    value: originalGetBoundingClientRect,
  });

  if (originalOffsetWidth) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetWidth",
      originalOffsetWidth,
    );
  } else {
    delete HTMLElement.prototype.offsetWidth;
  }

  if (originalOffsetHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetHeight",
      originalOffsetHeight,
    );
  } else {
    delete HTMLElement.prototype.offsetHeight;
  }
});

function renderTwoCharts() {
  return render(
    <>
      <PerformanceChart chartData={chartData} contextSlider={8192} />
      <PerformanceChart chartData={chartData} contextSlider={4096} />
    </>,
  );
}

function getGradientIds(container) {
  return [...container.querySelectorAll("linearGradient")].map(
    (node) => node.id,
  );
}

function getReferencedFillIds(container) {
  return [...container.querySelectorAll('[fill^="url(#"]')]
    .map((node) => node.getAttribute("fill"))
    .map((fill) => fill?.match(/^url\(#(.+)\)$/)?.[1])
    .filter(Boolean);
}

describe("PerformanceChart - gradient id uniqueness", () => {
  it("renders two instances with distinct gradient ids", () => {
    const { container } = renderTwoCharts();

    const ids = getGradientIds(container);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it("renders fill references that point to existing gradients", () => {
    const { container } = renderTwoCharts();

    const ids = getGradientIds(container);
    const fillIds = getReferencedFillIds(container);

    expect(fillIds.length).toBeGreaterThan(0);

    for (const id of fillIds) {
      expect(ids).toContain(id);
    }
  });
});
