/**
 * useLocalStorage — thin wrapper around usehooks-ts, re-exported so the rest of
 * the app imports from a single internal path and can swap implementations
 * later without touching every consumer.
 *
 * usehooks-ts handles JSON serialization, SSR safety, and cross-tab
 * synchronization that would otherwise be hand-rolled (and usually buggy)
 * in every localStorage-backed state slice.
 */
export { useLocalStorage } from "usehooks-ts";

