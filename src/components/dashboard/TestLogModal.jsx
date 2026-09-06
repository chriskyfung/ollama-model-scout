import { Terminal, X } from "lucide-react";

/**
 * Floating terminal-style modal that surfaces the batch-test logs.
 *
 * Props:
 *   - open:   boolean
 *   - logs:   Array<{ time: string, model: string, status: "ok"|"error"|"info", message: string }>
 *   - isTesting: boolean — shows the "executing" pulse line
 *   - onClose: () => void
 */
export default function TestLogModal({ open, logs, isTesting, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden h-[60vh] max-h-[600px] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="批次測試終端日誌"
      >
        {/* Terminal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
            <Terminal className="w-4 h-4 text-cyan-400" />
            批次測試終端日誌 (Batch Test Logs)
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            aria-label="關閉測試日誌"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

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
              等待測試開始...
            </div>
          )}
          {isTesting && (
            <div className="flex items-center gap-2 text-slate-500 mt-4">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              執行中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
