import { useTranslation } from "react-i18next";
import { Cpu, HardDrive, Sliders, XCircle, Zap } from "lucide-react";
import { formatParameterSize } from "@/lib/format";
import { calculatePerformance } from "@/lib/perf";
import PerformanceChart from "./PerformanceChart";

/**
 * 戰略指揮艙 / 超頻預估器 (`#overclock`). Extracted verbatim from App.jsx —
 * the IIFE perf computation is now a plain inline call (still pure via
 * calculatePerformance).
 */
export default function OverclockPanel({
  model,
  onClose,
  contextSlider,
  setContextSlider,
  hardware,
  chartData,
}) {
  const { t } = useTranslation();

  if (!model) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-1">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">
          {t("overclock.placeholderTitle")}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {t("overclock.placeholderDesc")}
        </p>
      </div>
    );
  }

  const perf = calculatePerformance(
    contextSlider,
    hardware.vram,
    hardware.ram,
    model.details?.parameter_size,
    model.details?.quantization_level,
  );

  const vramPercent =
    hardware.vram > 0
      ? Math.min((perf.vramUsed / hardware.vram) * 100, 100)
      : 0;
  const ramPercent = Math.min(
    (perf.ramUsed / hardware.ram) * 100,
    100,
  );

  return (
    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row gap-8 relative overflow-hidden">
      {/* 左側：推論控制與硬體溢流預估 */}
      <div className="flex-1 space-y-6 relative z-10">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {model.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t("overclock.parameterSizeLabel")}{" "}
              {formatParameterSize(
                model.details?.parameter_size,
              )}{" "}
              | {t("overclock.quantizationLabel")}{" "}
              {model.details?.quantization_level?.toUpperCase() ||
                t("overclock.unknown")}{" "}
              | {t("overclock.maxContextLabel")}{" "}
              {(
                model.details?.context_length || 0
              ).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Context 快捷超頻 */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setContextSlider(2048)}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold transition-colors"
          >
            {t("overclock.preset.fast")}
          </button>
          <button
            onClick={() => setContextSlider(8192)}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-bold transition-colors"
          >
            {t("overclock.preset.balanced")}
          </button>
          <button
            onClick={() =>
              setContextSlider(
                model.details?.context_length || 32768,
              )
            }
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-bold transition-colors"
          >
            {t("overclock.preset.max")}
          </button>
        </div>

        {/* Context 滑桿 */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>{t("overclock.contextLabel")}</span>
            <span className="text-cyan-400 font-mono font-bold">
              {contextSlider.toLocaleString()} Tokens
            </span>
          </div>
          <input
            type="range"
            min="2048"
            max={model.details?.context_length || 131072}
            step="2048"
            value={contextSlider}
            onChange={(e) => setContextSlider(Number(e.target.value))}
            className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
        </div>

        {/* 雙層液態溢流進度條 (Spillover Matrix) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          {/* VRAM 狀態條 */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />{" "}
                {t("overclock.vramCore")}
              </span>
              <span className="font-mono text-slate-200">
                {perf.vramUsed} / {hardware.vram} GB
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                style={{ width: `${vramPercent}%` }}
                className={`h-full rounded-full transition-all duration-300 bg-linear-to-r ${
                  vramPercent >= 100
                    ? "from-amber-500 to-rose-500 animate-pulse"
                    : "from-emerald-500 to-cyan-400"
                }`}
              />
            </div>
          </div>

          {/* System RAM 溢流狀態條 */}
          <div
            className={`transition-opacity duration-300 ${perf.ramUsed > 0 ? "opacity-100" : "opacity-50"}`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />{" "}
                {t("overclock.ramSpillover")}
                {perf.ramUsed > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {t("terminology.pcieRouting")}
                  </span>
                )}
              </span>
              <span className="font-mono text-slate-200">
                {perf.ramUsed} / {hardware.ram} GB
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                style={{ width: `${ramPercent}%` }}
                className={`h-full rounded-full transition-all duration-300 bg-linear-to-r ${
                  perf.isOverloaded
                    ? "from-rose-600 to-red-600 animate-pulse"
                    : "from-amber-500 to-orange-500"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右側：黃金推論區 Recharts 視覺圖表 */}
      <div className="flex-1 min-h-70 bg-slate-950/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />{" "}
            {t("overclock.chart.title")}
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
            {t("overclock.chart.sweetSpot")}
          </span>
        </div>

        <PerformanceChart chartData={chartData} contextSlider={contextSlider} />
      </div>
    </div>
  );
}
