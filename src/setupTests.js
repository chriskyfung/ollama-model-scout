/**
 * Global test setup for Vitest (jsdom).
 * Mirrors the minimal expectations of the React component tests: a DOM and
 * a mocked matchMedia used by some Tailwind animations.
 */
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia; provide a silent mock.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false,
  })),
});

afterEach(() => {
  vi.restoreAllMocks();
});
