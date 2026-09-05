import { describe, it, expect } from "vitest";
import {
  getBitsPerParam,
  parseParamSizeToNum,
  calculatePerformance,
} from "@/lib/perf";

describe("getBitsPerParam", () => {
  it("falls back to 4.5 for unknown / empty", () => {
    expect(getBitsPerParam("")).toBe(4.5);
    expect(getBitsPerParam(undefined)).toBe(4.5);
    expect(getBitsPerParam("Q9_FUBAR")).toBe(4.5);
  });
  it("returns the right bit width per quantization family", () => {
    expect(getBitsPerParam("F16")).toBe(16);
    expect(getBitsPerParam("F32")).toBe(32);
    expect(getBitsPerParam("Q4_K_M")).toBe(4.5);
  });
});

describe("parseParamSizeToNum", () => {
  it("parses raw billions as billions", () => {
    expect(parseParamSizeToNum("70B")).toBe(70);
    expect(parseParamSizeToNum("1.1B")).toBe(1.1);
  });
  it("converts millions to billions", () => {
    expect(parseParamSizeToNum("500M")).toBe(0.5);
  });
  it("handles the Cloud sentinel", () => {
    expect(parseParamSizeToNum("Cloud")).toBe(7);
    expect(parseParamSizeToNum("")).toBe(7);
    expect(parseParamSizeToNum(undefined)).toBe(7);
  });
});

describe("calculatePerformance", () => {
  it("reports overload when demand exceeds GPU VRAM", () => {
    const perf = calculatePerformance(16384, 24, 64, "70B", "Q4_K_M");
    expect(perf.isOverloaded).toBe(true);
    expect(perf.vramUsed).toBe(24);
  });

  it("keeps throughput within the defined ceiling", () => {
    const perf = calculatePerformance(4096, 0, 64, "1.1B", "F16");
    expect(perf.tokensPerSecond).toBeGreaterThan(0);
    expect(perf.tokensPerSecond).toBeLessThanOrEqual(120);
    // CPU-only path → no VRAM used
    expect(perf.vramUsed).toBe(0);
  });
});
