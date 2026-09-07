import { describe, it, expect } from "vitest";
import { MOCK_MODELS } from "@/data/models";

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