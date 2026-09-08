import { describe, it, expect } from "vitest";
import {
  isRemoteModel,
  getAvailableCapabilities,
  getAvailableFamilies,
  getAvailableQuantizations,
  buildChartData,
} from "../models";
import { calculatePerformance } from "../perf";

describe("isRemoteModel", () => {
  it("detects remote via size === 'remote'", () => {
    expect(isRemoteModel({ size: "remote" })).toBe(true);
  });
  it("detects remote via details.format === 'api'", () => {
    expect(isRemoteModel({ size: 123, details: { format: "api" } })).toBe(true);
  });
  it("detects remote via remote_model flag", () => {
    expect(isRemoteModel({ size: 123, remote_model: "gpt" })).toBe(true);
  });
  it("returns false for local models", () => {
    expect(isRemoteModel({ size: 4096, details: { format: "gguf" } })).toBe(
      false,
    );
  });
});

describe("facets", () => {
  const models = [
    { capabilities: ["tools", "vision"], details: { family: "qwen2", quantization_level: "q4_0" } },
    { capabilities: ["tools"], details: { family: "llama3", quantization_level: "Q8_0" } },
    {},
  ];
  it("collects distinct capabilities", () => {
    expect(getAvailableCapabilities(models)).toEqual(["tools", "vision"]);
  });
  it("collects sorted families, dropping blanks", () => {
    expect(getAvailableFamilies(models)).toEqual(["llama3", "qwen2"]);
  });
  it("uppercases and sorts quantization levels", () => {
    expect(getAvailableQuantizations(models)).toEqual(["Q4_0", "Q8_0"]);
  });
});

describe("buildChartData", () => {
  it("returns [] without a model", () => {
    expect(buildChartData(null, { vram: 24, ram: 64 }, calculatePerformance)).toEqual([]);
  });
  it("clips steps to max context and dedupes ascending", () => {
    const model = { details: { context_length: 8192 } };
    const data = buildChartData(model, { vram: 24, ram: 64 }, calculatePerformance);
    expect(data.map((d) => d.contextNum)).toEqual([2048, 4096, 8192]);
  });
});
