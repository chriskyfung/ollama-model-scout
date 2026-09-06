import { describe, it, expect } from "vitest";
import { MOCK_MODELS, FAQ_ITEMS } from "@/data/models";

describe("FAQ_ITEMS", () => {
  it("every item has a stable, unique id", () => {
    const ids = FAQ_ITEMS.map((item) => item.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(typeof id).toBe("string"));
  });
});

describe("MOCK_MODELS", () => {
  it("exposes the expected fields used by the UI", () => {
    const first = MOCK_MODELS[0];
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("size");
    expect(first.details).toHaveProperty("family");
    expect(first.details).toHaveProperty("parameter_size");
    expect(first.details).toHaveProperty("quantization_level");
    expect(first.details).toHaveProperty("context_length");
  });
});