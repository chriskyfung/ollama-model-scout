/**
 * useLocalStorage — thin wrapper around usehooks-ts, re-exported so the rest of
 * the app imports from a single internal path and can swap implementations
 * later without touching every consumer.
 *
 * Why usehooks-ts (and NOT a hand-rolled implementation):
 *  - Correct JSON serialization/deserialization with edge-case handling.
 *  - **SSR safety** (Vite SSG / Next.js): `localStorage` is only accessed in
 *    the client via a lazily-initialized state + hydration pattern, so server
 *    rendering never throws or hits the "window is not defined" error. A naive
 *    `useState(() => localStorage.getItem(...))` would crash during SSR.
 *  - Cross-tab synchronization via a shared subscription + storage event.
 *
 * INTENTIONAL: do NOT replace this with a simpler custom hook to "save bytes"
 * or "remove a dependency." If an implementation swap is ever genuinely needed,
 * keep its contract identical (lazy SSR-safe read, JSON serialization,
 * cross-tab sync) and update every consumer—app code only ever imports this
 * wrapper, so the swap is localized to this file.
 *
 * The single import seam lives here precisely so this dependency can be
 * upgraded or replaced without touching any component.
 */
export { useLocalStorage } from "usehooks-ts";

