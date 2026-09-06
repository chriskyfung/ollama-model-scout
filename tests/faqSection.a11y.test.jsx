import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import FaqSection from "@/components/dashboard/FaqSection";

// Small fixture keeps this test independent of data/models.js contents.
const TEST_ITEMS = [
  { id: "vram-overflow", q: "爆顯存怎麼辦？", a: "啟用 RAM spillover。" },
  { id: "kv-cache-calculation", q: "KV Cache 怎麼算？", a: "依 Context 長度線性成長。" },
];

// Mirrors how App.jsx hosts FaqSection: openIndex state + onToggle => setOpenIndex.
function StatefulFaq({ items = TEST_ITEMS, defaultOpen = null }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  return <FaqSection items={items} openIndex={openIndex} onToggle={setOpenIndex} />;
}

describe("FaqSection — accordion a11y", () => {
  it("renders one expand/collapse button per item", () => {
    render(<StatefulFaq defaultOpen={null} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(TEST_ITEMS.length);
  });

  it("animates aria-expanded from false → true when opened", async () => {
    render(<StatefulFaq defaultOpen={null} />);
    const q1Button = screen.getByText(TEST_ITEMS[0].q).closest("button");
    expect(q1Button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(q1Button);

    expect(q1Button).toHaveAttribute("aria-expanded", "true");
  });

  it("aria-controls points to an existing panel and the panel references back", async () => {
    render(<StatefulFaq defaultOpen={null} />);
    const q1Button = screen.getByText(TEST_ITEMS[0].q).closest("button");

    // Before opening, the controlled panel must NOT exist in the DOM.
    expect(q1Button).toHaveAttribute("aria-controls", "faq-panel-vram-overflow");
    expect(document.getElementById("faq-panel-vram-overflow")).not.toBeInTheDocument();

    // Open the panel; the controlled region must now exist and be linked.
    await userEvent.click(q1Button);
    const panel = document.getElementById("faq-panel-vram-overflow");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", "faq-header-vram-overflow");
    expect(q1Button).toHaveAttribute("id", "faq-header-vram-overflow");
  });

  it("toggles openIndex via onToggle, collapsing back to null on re-click", async () => {
    render(<StatefulFaq defaultOpen={0} />);
    const q1Button = screen.getByText(TEST_ITEMS[0].q).closest("button");
    expect(q1Button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(TEST_ITEMS[0].a)).toBeInTheDocument();

    await userEvent.click(q1Button);

    expect(q1Button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(TEST_ITEMS[0].a)).not.toBeInTheDocument();
  });

  it("supports multiple accordion items with independent states", async () => {
    render(<StatefulFaq defaultOpen={1} />);
    const q0 = screen.getByText(TEST_ITEMS[0].q).closest("button");
    const q1 = screen.getByText(TEST_ITEMS[1].q).closest("button");
    expect(q0).toHaveAttribute("aria-expanded", "false");
    expect(q1).toHaveAttribute("aria-expanded", "true");
    expect(q1).toHaveAttribute("aria-controls", "faq-panel-kv-cache-calculation");
  });
});
