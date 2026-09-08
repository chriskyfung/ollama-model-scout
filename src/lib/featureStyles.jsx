import { Sliders, Layers, Terminal, ShieldCheck } from "lucide-react";

/**
 * Per-card styling for the `features.items` grid (rendered by App.jsx),
 * applied positionally: card i uses FEATURE_STYLES[i % length].
 *
 * SINGLE SOURCE OF TRUTH: tests/i18n.test.js imports this module and asserts
 * that every locale's `features.items` array has exactly FEATURE_STYLES.length
 * entries. Editing this array automatically updates the test expectation —
 * but remember to also add/remove the corresponding item in ALL 8 locale
 * JSON files, or the tests will (correctly) fail.
 *
 * NOTE: the icon JSX elements are created once at module load and their
 * single element references are reused across every render and card. This
 * is intentional and safe — React elements are immutable descriptors — and
 * it saves re-allocating them on each render.
 */
export const FEATURE_STYLES = [
  { icon: <Sliders className="w-5 h-5" />, hover: "hover:border-cyan-500/40", bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
  { icon: <Layers className="w-5 h-5" />, hover: "hover:border-emerald-500/40", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  { icon: <Terminal className="w-5 h-5" />, hover: "hover:border-indigo-500/40", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
  { icon: <ShieldCheck className="w-5 h-5" />, hover: "hover:border-teal-500/40", bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400" },
];
