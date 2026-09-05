import { AlertTriangle, XCircle, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * Connection status banner shown below the header when a message exists.
 *
 * Props:
 *   - apiStatus: { state, isFallback, message }
 *   - allowMockFallback: boolean
 *   - onToggleFallback: (checked: boolean) => void  (calls fetchModels)
 *   - onRetry: () => void
 */
export default function ConnectionBanner({
  apiStatus,
  allowMockFallback,
  onToggleFallback,
  onRetry,
}) {
  if (!apiStatus.message) return null;
  const flag =
    apiStatus.state === "error" || apiStatus.isFallback ? "warn" : "ok";
  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in ${
        flag === "warn"
          ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
          : "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {apiStatus.isFallback ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : apiStatus.state === "error" ? (
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{apiStatus.message}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {apiStatus.state === "error" && (
          <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={allowMockFallback}
              onChange={(e) => onToggleFallback(e.target.checked)}
              className="accent-cyan-500 rounded cursor-pointer"
            />
            <span>啟用 Mock 資料</span>
          </label>
        )}
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> 重試
        </button>
      </div>
    </div>
  );
}