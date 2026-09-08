import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

/**
 * Composition smoke tests for the refactored App.
 *
 * The data hook fetches once on mount; in jsdom the request fails and the
 * mock-fallback kicks in (allowMockFallback defaults to true), so the table
 * must render the MOCK_MODELS rows — verifying the full hook composition
 * still wires together exactly like the original monolith.
 */
describe("App — composition smoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders header, table with mock-fallback rows, and sections", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    render(<App />);

    // Mock fallback models land in the diagnostics table.
    await waitFor(() => {
      expect(screen.getByText("llama3.3:70b-instruct-q4_K_M")).toBeInTheDocument();
    });

    // Key sections/landmarks exist.
    expect(document.getElementById("models")).toBeInTheDocument();
    expect(document.getElementById("overclock")).toBeInTheDocument();
    expect(document.getElementById("features")).toBeInTheDocument();
    expect(document.getElementById("faq")).toBeInTheDocument();
  });

  it("selecting a model populates the overclock panel and presets update the slider", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("llama3.3:70b-instruct-q4_K_M")).toBeInTheDocument();
    });

    await user.click(screen.getByText("llama3.3:70b-instruct-q4_K_M"));

    // Overclock panel header now shows the selected model.
    expect(screen.getAllByText("llama3.3:70b-instruct-q4_K_M").length).toBeGreaterThan(1);

    // The balanced preset resets the context slider to 8192.
    const balanced = screen.getByText(/Balanced/i);
    await user.click(balanced);
    expect(screen.getByText("8,192 Tokens")).toBeInTheDocument();
  });
});
