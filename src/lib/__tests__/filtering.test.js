import { describe, it, expect } from "vitest";
import { filterAndSortModels, sumLocalSize } from "../filtering";
import { DEFAULT_FILTER_STATE } from "../constants";

const local = (name, extra = {}) => ({
  name,
  size: 1024,
  capabilities: ["tools"],
  details: { family: "qwen2", quantization_level: "Q4_0", context_length: 8192 },
  ...extra,
});
const remote = (name, extra = {}) => ({
  name,
  size: "remote",
  remote_model: true,
  capabilities: ["vision"],
  details: { family: "gpt", quantization_level: "F16", context_length: 128000 },
  ...extra,
});

const cfg = (overrides = {}) => ({
  searchQuery: "",
  filters: { ...DEFAULT_FILTER_STATE },
  sortConfig: { key: "name", direction: "asc" },
  testResults: {},
  ...overrides,
});

describe("filterAndSortModels", () => {
  const models = [local("b"), local("a"), remote("c"), local("d", { size: 2048 })];

  it("returns all models with default filters, sorted by name asc", () => {
    expect(filterAndSortModels(models, cfg()).map((m) => m.name)).toEqual([
      "a", "b", "c", "d",
    ]);
  });

  it("sorts by name desc", () => {
    expect(
      filterAndSortModels(models, cfg({ sortConfig: { key: "name", direction: "desc" } })).map((m) => m.name),
    ).toEqual(["d", "c", "b", "a"]);
  });

  it("filters type=remote", () => {
    const out = filterAndSortModels(models, cfg({ filters: { ...DEFAULT_FILTER_STATE, type: "remote" } }));
    expect(out.map((m) => m.name)).toEqual(["c"]);
  });

  it("filters by capability (every-match semantics)", () => {
    const out = filterAndSortModels(models, cfg({ filters: { ...DEFAULT_FILTER_STATE, capabilities: ["tools", "vision"] } }));
    expect(out).toHaveLength(0);
  });

  it("filters by test status success/error/untested", () => {
    const testResults = { a: { status: "ok" }, b: { status: "error" } };
    const base = { searchQuery: "", sortConfig: { key: "name", direction: "asc" }, testResults };
    expect(filterAndSortModels(models, { ...base, filters: { ...DEFAULT_FILTER_STATE, testStatus: "success" } }).map((m) => m.name)).toEqual(["a"]);
    expect(filterAndSortModels(models, { ...base, filters: { ...DEFAULT_FILTER_STATE, testStatus: "error" } }).map((m) => m.name)).toEqual(["b"]);
    expect(filterAndSortModels(models, { ...base, filters: { ...DEFAULT_FILTER_STATE, testStatus: "untested" } }).map((m) => m.name)).toEqual(["c", "d"]);
  });

  it("matches quantization case-insensitively", () => {
    const out = filterAndSortModels(models, cfg({ filters: { ...DEFAULT_FILTER_STATE, quantizations: ["Q4_0"] } }));
    expect(out.map((m) => m.name)).toEqual(["a", "b", "d"]);
  });

  it("search matches serialized JSON (lowercased)", () => {
    expect(filterAndSortModels(models, cfg({ searchQuery: "llama" }))).toHaveLength(0);
    expect(filterAndSortModels(models, cfg({ searchQuery: "gpt" })).map((m) => m.name)).toEqual(["c"]);
  });

  it("sorts by context_length numerically from details", () => {
    const out = filterAndSortModels(models, cfg({ sortConfig: { key: "context_length", direction: "asc" } }));
    expect(out[0].details.context_length).toBe(8192);
    expect(out[out.length - 1].details.context_length).toBe(128000);
  });

  it("sorts by status weight ok > error > untested", () => {
    const testResults = { a: { status: "error" }, b: { status: "ok" } };
    const out = filterAndSortModels(models, {
      searchQuery: "",
      filters: { ...DEFAULT_FILTER_STATE },
      sortConfig: { key: "status", direction: "desc" },
      testResults,
    });
    expect(out.map((m) => m.name)).toEqual(["b", "a", "c", "d"]);
  });

  it("sorts remote size (-1) below local sizes", () => {
    const out = filterAndSortModels(models, cfg({ sortConfig: { key: "size", direction: "asc" } }));
    expect(out[0].name).toBe("c");
  });
});

describe("sumLocalSize", () => {
  it("sums numeric sizes and treats remote as 0", () => {
    expect(sumLocalSize([{ size: 100 }, { size: "remote" }, { size: 23 }])).toBe(123);
  });
});
