import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FilterButtonBar from "@/components/dashboard/FilterButtonBar";
import { DEFAULT_FILTER_STATE } from "@/lib/constants";

// Expected class strings are deliberately hand-pinned here, NOT imported from
// the component. Design tradeoff: importing from FilterButtonBar would be
// circular (the test would pass even if every class string were wrong), and
// would only verify the wiring (active -> constant). Pinning the literals
// verifies the *rendered output*, which is what makes the component's
// "code-shape normalization, same output" claim self-verifying, and catches
// any change to the pill classes (even token reordering). Downside: an INTENTIONAL
// style change (e.g. adding a utility class) now fails this test on purpose,
// requiring a deliberate test update. That friction is intended.
//
// Buttons are located by getByRole("button", { name }) — the accessible name
// is still the i18n label, but role-based lookup is more robust than text
// matching (wrapping markup changes / nested nodes won't break it).
const PILL_BASE =
  "px-3 py-1 rounded-lg border transition-all bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
const RADIO_PILL_BASE =
  "px-3 py-1 rounded-lg font-semibold transition-all border bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
const ACTIVE = {
  cyan: "px-3 py-1 rounded-lg font-semibold transition-all border bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950",
  indigoShadow:
    "px-3 py-1 rounded-lg font-semibold transition-all border bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-950",
  indigo:
    "px-3 py-1 rounded-lg border transition-all bg-indigo-500/20 border-indigo-500 text-indigo-300",
  teal: "px-3 py-1 rounded-lg border transition-all bg-teal-500/20 border-teal-500 text-teal-300",
  emerald:
    "px-3 py-1 rounded-lg border transition-all bg-emerald-500/20 border-emerald-500 text-emerald-300",
};

// A state where every row has exactly one active pill so both the active and
// inactive branches are exercised per row.
const FILTERS = {
  ...DEFAULT_FILTER_STATE,
  type: "local",
  capabilities: ["tools"],
  families: ["qwen2"],
  quantizations: ["Q8_0"],
  testStatus: "success",
};

const renderBar = () =>
  render(
    <FilterButtonBar
      filters={FILTERS}
      setFilters={() => {}}
      toggleFilter={() => {}}
      availableCapabilities={["tools", "vision"]}
      availableFamilies={["llama3", "qwen2"]}
      availableQuantizations={["Q4_0", "Q8_0"]}
    />,
  );

describe("FilterButtonBar - active-state pill classes", () => {
  it("renders all filter buttons without throwing", () => {
    renderBar();
    // 3 type + 2 capabilities + 2 families + 2 quantizations + 4 test status.
    expect(screen.getAllByRole("button")).toHaveLength(13);
  });

  it("Type row uses the radio-style active (cyan) and inactive (radioPillBase) classes", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "LOCAL" }).className).toBe(
      ACTIVE.cyan,
    );
    expect(screen.getByRole("button", { name: "ALL" }).className).toBe(
      RADIO_PILL_BASE,
    );
  });

  it("Test Status row uses the radio-style active (indigoShadow) and inactive (radioPillBase) classes", () => {
    renderBar();
    expect(
      screen.getByRole("button", { name: "Connected" }).className,
    ).toBe(ACTIVE.indigoShadow);
    expect(
      screen.getByRole("button", { name: "All Status" }).className,
    ).toBe(RADIO_PILL_BASE);
  });

  it("Capabilities row uses multi-select active (indigo) and inactive (pillBase) classes", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "tools" }).className).toBe(
      ACTIVE.indigo,
    );
    expect(screen.getByRole("button", { name: "vision" }).className).toBe(
      PILL_BASE,
    );
  });

  it("Family row uses multi-select active (teal) and inactive (pillBase) classes", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "qwen2" }).className).toBe(
      ACTIVE.teal,
    );
    expect(screen.getByRole("button", { name: "llama3" }).className).toBe(
      PILL_BASE,
    );
  });

  it("Quantization row uses multi-select active (emerald) and inactive (pillBase) classes", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "Q8_0" }).className).toBe(
      ACTIVE.emerald,
    );
    expect(screen.getByRole("button", { name: "Q4_0" }).className).toBe(
      PILL_BASE,
    );
  });
});
