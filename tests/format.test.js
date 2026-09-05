import { describe, it, expect } from "vitest";
import { formatBytes, formatParameterSize, isDigit } from "@/lib/format";

describe("formatBytes", () => {
    it("formats common sizes (1024-base, 2 decimals)", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1048576)).toBe("1 MB"); // exact 1 MiB → "1 MB"
    expect(formatBytes(1073741824)).toBe("1 GB"); // exact 1 GiB → "1 GB"
    expect(formatBytes(5000000000)).toBe("4.66 GB");
  });
  it("handles non-numeric, nullish, and the 'remote' sentinel", () => {
    expect(formatBytes(undefined)).toBe("0 B");
    expect(formatBytes(null)).toBe("0 B");
    expect(formatBytes("remote")).toBe("Cloud");
    expect(formatBytes("not-a-number")).toBe("0 B");
  });
});

describe("formatParameterSize", () => {
  it("scales billions and millions", () => {
    expect(formatParameterSize("70B")).toBe("70B");
    expect(formatParameterSize("7.5B")).toBe("7.5B");
    expect(formatParameterSize("100M")).toBe("100M");
  });
  it("returns dash for empty and passthrough for raw strings", () => {
    expect(formatParameterSize("")).toBe("-");
    expect(formatParameterSize("Cloud")).toBe("Cloud");
  });
});

describe("isDigit", () => {
  it("recognizes numeric strings, rejects the rest", () => {
    expect(isDigit("1")).toBe(true);
    expect(isDigit("1.5")).toBe(true);
    expect(isDigit("B")).toBe(false);
    expect(isDigit(null)).toBe(false);
    expect(isDigit(undefined)).toBe(false);
  });
});
