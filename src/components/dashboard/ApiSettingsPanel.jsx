import { Server, Cpu } from "lucide-react";
import { HARDWARE_PRESETS } from "@/lib/constants";

/**
 * Expandable "Remote API + Hardware" configuration panel.
 * Rendered inside <main> when `open` is true.
 *
 * Props:
 *   - open: boolean
 *   - apiConfig / setApiConfig: { url, key, headers } + setter
 *   - hardware / setHardware:   { vram, ram } + setter
 *   - onApply: () => void — re-fetches models with the new settings
 */
export default function ApiSettingsPanel({
  open,
  apiConfig,
  setApiConfig,
  hardware,
  setHardware,
  onApply,
}) {
  // Early-return before any render work: when collapsed we render nothing, so
  // none of the inputs or the HARDWARE_PRESETS mapping below are allocated.
  if (!open) return null;
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl animate-in slide-in-from-top-4">
      {/* API 連線區 */}
      <div className="md:col-span-2 space-y-4 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <Server className="w-4 h-4" /> 遠端 Ollama API 配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Base URL
            </label>
            <input
              type="text"
              value={apiConfig.url}
              onChange={(e) =>
                setApiConfig({ ...apiConfig, url: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
              placeholder="http://localhost:11434"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Bearer API Key (選填)
            </label>
            <input
              type="password"
              value={apiConfig.key}
              onChange={(e) =>
                setApiConfig({ ...apiConfig, key: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
              placeholder="sk-..."
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Custom Headers (JSON 格式)
          </label>
          <textarea
            value={apiConfig.headers}
            onChange={(e) =>
              setApiConfig({ ...apiConfig, headers: e.target.value })
            }
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 outline-none resize-y min-h-[80px]"
            placeholder={`{\n  "X-Custom-Header": "Value"\n}`}
          />
        </div>
      </div>

      {/* 本地硬體規格設定區 (解決使用者輸入 VRAM/RAM 需求) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> 本地硬體規格模擬 (VRAM / RAM)
        </h3>
        <div>
          <label className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
            <span>GPU VRAM 顯存</span>
            <span className="text-emerald-400 font-mono font-bold">
              {hardware.vram} GB
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="128"
            value={hardware.vram}
            onChange={(e) =>
              setHardware({
                ...hardware,
                vram: Math.max(0, Number(e.target.value)),
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-sm font-mono text-slate-200 focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
            <span>系統 RAM 記憶體</span>
            <span className="text-cyan-400 font-mono font-bold">
              {hardware.ram} GB
            </span>
          </label>
          <input
            type="number"
            min="4"
            max="512"
            value={hardware.ram}
            onChange={(e) =>
              setHardware({
                ...hardware,
                ram: Math.max(4, Number(e.target.value)),
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-sm font-mono text-slate-200 focus:border-cyan-500 outline-none"
          />
        </div>

        {/* 快捷預設按鈕 */}
        <div className="pt-1 flex flex-wrap gap-2">
          {HARDWARE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setHardware({ vram: p.vram, ram: p.ram })}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-3 flex justify-end pt-2 border-t border-slate-800">
        <button
          onClick={onApply}
          className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-950/50"
        >
          套用設定並重新載入
        </button>
      </div>
    </div>
  );
}
