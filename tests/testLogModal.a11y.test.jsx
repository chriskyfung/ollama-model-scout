import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestLogModal from "@/components/dashboard/TestLogModal";

const DUMMY_LOGS = [
  { time: "2024-01-01T00:00:00.000Z", model: "System", status: "info", message: "Test start" },
  { time: "2024-01-01T00:00:01.000Z", model: "System", status: "info", message: "Test done" },
];

describe("TestLogModal — dialog & a11y", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <TestLogModal open={false} logs={[]} isTesting={false} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes correct ARIA roles/attributes and moves focus to the close button on open", () => {
    render(<TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "test-log-title");
    expect(dialog).toHaveAttribute("aria-describedby", "test-log-desc");
    expect(document.getElementById("test-log-title")).toBeInTheDocument();
    expect(document.getElementById("test-log-desc")).toBeInTheDocument();

    // Focus falls on the close button immediately upon open.
    const closeBtn = screen.getByRole("button", { name: /Close test logs/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveFocus();
  });

  it("restores body scroll on unmount without throwing", () => {
    const prev = document.body.style.overflow;
    const { unmount } = render(
      <TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={() => {}} />
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(prev);
  });

  it("closes when Escape is pressed on the dialog", () => {
    const handleClose = vi.fn();
    render(<TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={handleClose} />);
    // The keydown handler is attached to the dialog div itself, not document.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", async () => {
    const handleClose = vi.fn();
    render(<TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={handleClose} />);
    await userEvent.click(screen.getByRole("button", { name: /Close test logs/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab within the dialog (single-focusable-element case)", () => {
    render(<TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={() => {}} />);
    const closeBtn = screen.getByRole("button", { name: /Close test logs/i });
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();

    const dialog = screen.getByRole("dialog");
    // Tab (no shift) — should wrap back to the only focusable element.
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: false });
    expect(closeBtn).toHaveFocus();
    // Shift+Tab — should also wrap back to the only focusable element.
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(closeBtn).toHaveFocus();
  });

  it("renders every log message alongside its model and timestamp", () => {
    render(<TestLogModal open logs={DUMMY_LOGS} isTesting={false} onClose={() => {}} />);
    expect(screen.getByText(/Test start/)).toBeInTheDocument();
    expect(screen.getByText(/Test done/)).toBeInTheDocument();
    // [System] appears once per log line → use getAllByText.
    expect(screen.getAllByText("[System]")).toHaveLength(DUMMY_LOGS.length);
  });
});
