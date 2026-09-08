import { useEffect, useRef, useCallback } from "react";
import { Terminal, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Floating terminal-style modal that surfaces the batch-test logs.
 *
 * Props:
 *   - open:   boolean
 *   - logs:   Array<{ time: string, model: string, status: "ok"|"error"|"info", message: string }>
 *   - isTesting: boolean — shows the "executing" pulse line
 *   - onClose: () => void
 *
 * A11y: renders a proper dialog (`role="dialog"` + `aria-modal` + labelled/described
 * by its title/description). On open it moves focus inside, traps Tab/Shift+Tab
 * within the dialog so keyboard users aren't stuck tabbing through background
 * content, closes on Escape, and restores focus to the previously-focused
 * element on unmount. Body scroll is locked while open.
 */
export default function TestLogModal({ open, logs, isTesting, onClose }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // Focus trap: keep Tab / Shift+Tab cycling within the dialog.
      if (e.key === "Tab") {
        const node = dialogRef.current;
        if (!node) return;
        const focusables = node.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    // Remember the trigger element so we can restore focus on close.
    previouslyFocusedRef.current = document.activeElement;
    // Move focus into the dialog (prefer the close button when it's present).
    (closeButtonRef.current || dialogRef.current)?.focus();
    // Lock body scroll while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden h-[60vh] max-h-[600px] animate-in zoom-in-95 duration-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-log-title"
        aria-describedby="test-log-desc"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Terminal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <h3
            id="test-log-title"
            className="text-sm font-bold flex items-center gap-2 text-slate-200"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            {t("logs.modalTitle")}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            aria-label={t("logs.closeAria")}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Screen-reader-only description of the dialog's purpose + dismissal hint */}
        <p id="test-log-desc" className="sr-only">
          {t("logs.srDesc")}
        </p>

        {/* Terminal Log Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-950 font-mono text-xs scroll-smooth">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="text-slate-600 shrink-0 select-none">
                {new Date(log.time).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  fractionalSecondDigits: 3,
                })}
              </span>
              <span
                className={`shrink-0 w-[140px] truncate ${
                  log.model === "System"
                    ? "text-indigo-400 font-bold"
                    : "text-slate-400"
                }`}
              >
                [{log.model}]
              </span>
              <span
                className={
                  log.status === "ok"
                    ? "text-emerald-400"
                    : log.status === "error"
                    ? "text-rose-400"
                    : "text-cyan-400"
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500 animate-pulse">
              {t("logs.waiting")}
            </div>
          )}
          {isTesting && (
            <div className="flex items-center gap-2 text-slate-500 mt-4">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              {t("logs.executing")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
