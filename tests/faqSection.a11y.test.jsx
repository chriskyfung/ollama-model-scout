import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import FaqSection from "@/components/dashboard/FaqSection";

// Mirrors how App.jsx hosts FaqSection: openIndex state + onToggle => setOpenIndex.
// FaqSection now builds its items from locale JSON (en in test setup), so we
// assert against the English strings from src/i18n/locales/en.json.
function StatefulFaq({ defaultOpen = null }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  return <FaqSection openIndex={openIndex} onToggle={setOpenIndex} />;
}

const Q1 = "What happens when VRAM overflows into system RAM?";
const Q2 = "How does the system precisely calculate KV Cache requirements for different context lengths?";

describe("FaqSection — accordion a11y", () => {
  it("renders one expand/collapse button per item", () => {
    render(<StatefulFaq defaultOpen={null} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("animates aria-expanded from false → true when opened", async () => {
    render(<StatefulFaq defaultOpen={null} />);
    const q1Button = screen.getByText(Q1).closest("button");
    expect(q1Button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(q1Button);

    expect(q1Button).toHaveAttribute("aria-expanded", "true");
  });

  it("aria-controls points to an existing panel and the panel references back", async () => {
    render(<StatefulFaq defaultOpen={null} />);
    const q1Button = screen.getByText(Q1).closest("button");

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
    const q1Button = screen.getByText(Q1).closest("button");
    expect(q1Button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/When the combined model weights/)).toBeInTheDocument();

    await userEvent.click(q1Button);

    expect(q1Button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/When the combined model weights/)).not.toBeInTheDocument();
  });

  it("supports multiple accordion items with independent states", async () => {
    render(<StatefulFaq defaultOpen={1} />);
    const q0 = screen.getByText(Q1).closest("button");
    const q1 = screen.getByText(Q2).closest("button");
    expect(q0).toHaveAttribute("aria-expanded", "false");
    expect(q1).toHaveAttribute("aria-expanded", "true");
    expect(q1).toHaveAttribute("aria-controls", "faq-panel-kv-cache-calculation");
  });
});
