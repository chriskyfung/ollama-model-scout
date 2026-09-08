import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  Search,
  Cloud,
  Cpu,
  ChevronDown,
  Filter,
  HardDrive,
  Zap,
  XCircle,
  Sliders,
  Terminal,
  Sparkles,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FaqSection from "@/components/dashboard/FaqSection";
import TestLogModal from "@/components/dashboard/TestLogModal";
import ConnectionBanner from "@/components/dashboard/ConnectionBanner";
import ApiSettingsPanel from "@/components/dashboard/ApiSettingsPanel";
import FeaturesSection from "@/components/dashboard/FeaturesSection";
import { useModels } from "@/hooks/useModels";
import {
  GITHUB_REPO,
  STORAGE_KEYS,
  DEFAULT_API_CONFIG,
  DEFAULT_HARDWARE,
  DEFAULT_COLUMNS,
  DEFAULT_FILTER_STATE,
  DEFAULT_SORT_CONFIG,
} from "@/lib/constants";
import {
  formatBytes,
  formatParameterSize,
} from "@/lib/format";
import { calculatePerformance } from "@/lib/perf";
import { FEATURE_STYLES } from "@/lib/featureStyles";
import { useModelFilters } from "@/hooks/useModelFilters";
import { useModelTesting } from "@/hooks/useModelTesting";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function App() {
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // --- State: Tactical Command Center panel ---
  const [selectedModel, setSelectedModel] = useState(null);
  const [contextSlider, setContextSlider] = useState(8192);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // --- Data layer (fetch-on-mount; onFinally preserves the original
  //     `finally { resetFilters() }` ordering after every fetch. The closure
  //     below references `filtersApi`, declared afterwards — safe because the
  //     callback only fires once the async fetch resolves, i.e. after render) ---
  const {
    apiConfig,
    setApiConfig,
    apiStatus,
    allowMockFallback,
    setAllowMockFallback,
    models,
    fetchModels,
  } = useModels({ onFinally: () => filtersApi.resetFilters() });

  // --- Batch testing (declared before the filter hook so its testResults can
  //     feed test-status filtering; handleBatchTest receives the filtered list
  //     at click time, avoiding a circular dependency) ---
  const testingApi = useModelTesting();

  // --- Filters / sort / columns ---
  const filtersApi = useModelFilters(models, testingApi.testResults);

  // --- Hardware specs (VRAM / RAM) — stays in App: shared by the settings
  //     panel (write) and the overclock planner (read) ---
  const [hardware, setHardware] = useLocalStorage(
    STORAGE_KEYS.hardware,
    DEFAULT_HARDWARE,
  );

  const chartData = useMemo(() => {
    if (!selectedModel) return [];
    const maxContext = selectedModel.details?.context_length || 131072;
    const baseSteps = [2048, 4096, 8192, 16384, 32768, 65536];
    const validSteps = baseSteps.filter((c) => c < maxContext);
    validSteps.push(maxContext);

    // 移除可能重複的數值並排序
    const uniqueSteps = Array.from(new Set(validSteps)).sort((a, b) => a - b);

    return uniqueSteps.map((c) => {
      const perf = calculatePerformance(
        c,
        hardware.vram,
        hardware.ram,
        selectedModel.details?.parameter_size,
        selectedModel.details?.quantization_level,
      );
      return {
        context: c >= 1024 ? `${Math.round(c / 1024)}K` : `${c}`,
        contextNum: c,
        ...perf,
      };
    });
  }, [selectedModel, hardware]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col justify-between scroll-smooth">
      <div>
        {/* === 1. 生產級懸浮 Header === */}
        <Header
          apiStatus={apiStatus}
          showApiSettings={showApiSettings}
          onToggleApiSettings={() => setShowApiSettings(!showApiSettings)}
          onNavigate={scrollToSection}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-16 space-y-8">
          {/* 連線狀態 Banner */}
          {/*
            PERF NOTE (toggle/retry handlers): the inline arrows below (onToggleFallback,
            onRetry) are recreated on every render. This is intentional and NOT worth
            memoizing yet:
              - `ConnectionBanner` is not wrapped in React.memo, so useCallback would not
                skip its re-render — the wrapper would just add indirection.
              - `onToggleFallback` closes over `fetchModels`, which itself closes over
                `apiConfig` + `allowMockFallback`; stabilizing the handler would force
                `fetchModels` into the mount `useEffect` deps and change the "fetch once on
                mount" behavior. Avoid unless a real profiling run demands it.
            Revisit ONLY if profiling shows ConnectionBanner/ApiSettingsPanel re-render cost
            at the top of the flame graph (then wrap ConnectionBanner in React.memo AND
            stabilize fetchModels with useCallback, scoped to a dedicated PR).
          */}
          <ConnectionBanner
            apiStatus={apiStatus}
            allowMockFallback={allowMockFallback}
            onToggleFallback={(v) => {
              setAllowMockFallback(v);
              fetchModels(v);
            }}
            onRetry={() => fetchModels()}
          />

          {/* 展開式 API & 硬體規格設定面板 */}
          <ApiSettingsPanel
            open={showApiSettings}
            apiConfig={apiConfig}
            setApiConfig={setApiConfig}
            hardware={hardware}
            setHardware={setHardware}
            onApply={fetchModels}
            />

          {/* === 2. 模型搜尋與診斷矩陣區塊 (`#models`) === */}
          <section id="models" className="scroll-mt-20">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("models.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>

                {/* 欄位顯示/隱藏選單 */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 text-sm font-medium text-slate-300"
                  >
                    <Filter className="w-4 h-4 text-cyan-400" />
                    <span>{t("models.columnCustomize")}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showColumnMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-1">
                      <div className="text-xs font-bold text-slate-400 px-2 pb-2 border-b border-slate-800">
                        {t("models.columnToggleTitle")}
                      </div>
                      {Object.keys(columns).map((col) => (
                        <label
                          key={col}
                          className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-800/80 rounded-lg cursor-pointer text-xs text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={columns[col]}
                            onChange={() =>
                              setColumns((p) => ({ ...p, [col]: !p[col] }))
                            }
                            className="accent-cyan-500 rounded"
                          />
                          <span>
                            {t(`models.tableHeaders.${col}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 多維度智慧動態篩選按鈕列 */}
              <div className="flex flex-col space-y-3 pt-3 border-t border-slate-800/60 text-xs">
                {/* 1. 類型 (Type) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                    {t("models.filters.type")}
                  </span>
                  {["all", "local", "remote"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters((p) => ({ ...p, type }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
                        filters.type === type
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {t("models.filters.types." + type)}
                    </button>
                  ))}
                </div>

                {/* 2. 能力 (Capabilities) */}
                {availableCapabilities.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                      {t("models.filters.caps")}
                    </span>
                    {availableCapabilities.map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleFilter("capabilities", c)}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          filters.capabilities.includes(c)
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. 家族 (Family) */}
                {availableFamilies.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                      {t("models.filters.family")}
                    </span>
                    {availableFamilies.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleFilter("families", f)}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          filters.families.includes(f)
                            ? "bg-teal-500/20 border-teal-500 text-teal-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. 量化 (Quantization - 全部大寫) */}
                {availableQuantizations.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                      {t("models.filters.quant")}
                    </span>
                    {availableQuantizations.map((q) => (
                      <button
                        key={q}
                        onClick={() => toggleFilter("quantizations", q)}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          filters.quantizations.includes(q)
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* 5. 測試狀態 (Test Status) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                    {t("models.filters.status")}
                  </span>
                  {[
                    { id: "all", label: t("models.filters.statuses.all") },
                    { id: "success", label: t("models.filters.statuses.success") },
                    { id: "error", label: t("models.filters.statuses.error") },
                    { id: "untested", label: t("models.filters.statuses.untested") },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() =>
                        setFilters((p) => ({ ...p, testStatus: st.id }))
                      }
                      className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
                        filters.testStatus === st.id
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-950"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 模型列表數據表格 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <tr>
                      {columns.name && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("name")}
                        >
                          {t("models.tableHeaders.name")}
                        </th>
                      )}
                      {columns.family && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("family")}
                        >
                          {t("models.tableHeaders.family")}
                        </th>
                      )}
                      {columns.parameterSize && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("parameter_size")}
                        >
                          {t("models.tableHeaders.parameterSize")}
                        </th>
                      )}
                      {columns.quantization && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("quantization_level")}
                        >
                          {t("models.tableHeaders.quantization")}
                        </th>
                      )}
                      {columns.contextLength && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("context_length")}
                        >
                          {t("models.tableHeaders.contextLength")}
                        </th>
                      )}
                      {columns.size && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("size")}
                        >
                          {t("models.tableHeaders.size")}
                        </th>
                      )}
                      {columns.status && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("status")}
                        >
                          {t("models.tableHeaders.status")}
                        </th>
                      )}
                      {columns.capabilities && (
                        <th className="p-4">{t("models.tableHeaders.capabilities")}</th>
                      )}
                      {columns.modifiedAt && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("modified_at")}
                        >
                          {t("models.tableHeaders.modifiedAt")}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredModels.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="p-8 text-center text-slate-500"
                        >
                          {t("models.emptyState")}
                        </td>
                      </tr>
                    ) : (
                      filteredModels.map((m) => {
                        const isRemote =
                          m.size === "remote" ||
                          m.details?.format === "api" ||
                          !!m.remote_model;
                        const quantUpper = m.details?.quantization_level
                          ? m.details.quantization_level.toUpperCase()
                          : "-";

                        return (
                          <tr
                            key={m.name}
                            onClick={() => setSelectedModel(m)}
                            className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                              selectedModel?.name === m.name
                                ? "bg-cyan-950/40 border-l-4 border-l-cyan-400"
                                : ""
                            }`}
                          >
                            {columns.name && (
                              <td className="p-4 font-semibold text-slate-200 flex items-center gap-2">
                                {m.name}
                                {isRemote && (
                                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] rounded">
                                    {t("models.cloudBadge")}
                                  </span>
                                )}
                              </td>
                            )}
                            {columns.family && (
                              <td className="p-4 text-slate-400">
                                {m.details?.family || "-"}
                              </td>
                            )}
                            {columns.parameterSize && (
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs font-mono text-slate-300">
                                  {formatParameterSize(
                                    m.details?.parameter_size,
                                  )}
                                </span>
                              </td>
                            )}
                            {columns.quantization && (
                              <td className="p-4 font-mono text-slate-300">
                                <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                                  {quantUpper}
                                </span>
                              </td>
                            )}
                            {columns.contextLength && (
                              <td className="p-4 font-mono text-xs text-slate-400">
                                {(
                                  m.details?.context_length || 0
                                ).toLocaleString()}
                              </td>
                            )}
                            {columns.size && (
                              <td className="p-4 font-mono text-xs">
                                {isRemote ? (
                                  <span className="inline-flex items-center gap-1.5 text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-800/40">
                                    <Cloud className="w-3.5 h-3.5" /> {t("models.cloudApiBadge")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/40">
                                    <HardDrive className="w-3.5 h-3.5" />{" "}
                                    {formatBytes(m.size)}
                                  </span>
                                )}
                              </td>
                            )}
                            {columns.status && (
                              <td className="p-4 font-mono text-xs">
                                {testResults[m.name] ? (
                                  <span
                                    className={`px-2 py-1 rounded-md text-[10px] border ${
                                      testResults[m.name].status === "ok"
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                    }`}
                                  >
                                    {testResults[m.name].msg}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">{t("models.statusDash")}</span>
                                )}
                              </td>
                            )}
                            {columns.capabilities && (
                              <td className="p-4">
                                <div className="flex gap-1 flex-wrap">
                                  {(m.capabilities || []).map((cap) => (
                                    <span
                                      key={cap}
                                      className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            )}
                            {columns.modifiedAt && (
                              <td className="p-4 text-xs text-slate-500 font-mono">
                                {m.modified_at
                                  ? new Date(m.modified_at).toLocaleDateString()
                                  : t("models.statusDash")}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 表格 Footer 統計列 */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    {t("models.footer.count")}{" "}
                    <strong className="text-white">
                      {filteredModels.length}
                    </strong>{" "}
                    {t("models.footer.countUnit")}
                  </span>
                  <span className="h-3 w-px bg-slate-800"></span>
                  <span>
                    {t("models.footer.localUsed")}{" "}
                    <strong className="text-emerald-400 font-mono">
                      {formatBytes(totalLocalSize)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {testLogs.length > 0 && (
                    <button
                      onClick={() => setShowLogs(true)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors text-xs font-semibold"
                    >
                      <Terminal className="w-3.5 h-3.5" /> {t("models.footer.viewLogs")}
                    </button>
                  )}
                  <button
                    onClick={handleBatchTest}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isTesting ? t("models.footer.batchTesting") : t("models.footer.batchTest")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* === 3. 戰略指揮艙 / 超頻預估器 (`#overclock`) === */}
          <section id="overclock" className="scroll-mt-20">
            {selectedModel ? (
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row gap-8 relative overflow-hidden">
                {/* 左側：推論控制與硬體溢流預估 */}
                <div className="flex-1 space-y-6 relative z-10">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedModel.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {t("overclock.parameterSizeLabel")}{" "}
                        {formatParameterSize(
                          selectedModel.details?.parameter_size,
                        )}{" "}
                        | {t("overclock.quantizationLabel")}{" "}
                        {selectedModel.details?.quantization_level?.toUpperCase() ||
                          t("overclock.unknown")}{" "}
                        | {t("overclock.maxContextLabel")}{" "}
                        {(
                          selectedModel.details?.context_length || 0
                        ).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedModel(null)}
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
                          selectedModel.details?.context_length || 32768,
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
                      max={selectedModel.details?.context_length || 131072}
                      step="2048"
                      value={contextSlider}
                      onChange={(e) => setContextSlider(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 雙層液態溢流進度條 (Spillover Matrix) */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    {(() => {
                      const perf = calculatePerformance(
                        contextSlider,
                        hardware.vram,
                        hardware.ram,
                        selectedModel.details?.parameter_size,
                        selectedModel.details?.quantization_level,
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
                        <>
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
                                className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${
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
                                className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${
                                  perf.isOverloaded
                                    ? "from-rose-600 to-red-600 animate-pulse"
                                    : "from-amber-500 to-orange-500"
                                }`}
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 右側：黃金推論區 Recharts 視覺圖表 */}
                <div className="flex-1 min-h-[280px] bg-slate-950/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />{" "}
                      {t("overclock.chart.title")}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                      {t("overclock.chart.sweetSpot")}
                    </span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorMemory"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorSpeed"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="contextNum"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(v) =>
                            v >= 1024 ? `${Math.round(v / 1024)}K` : `${v}`
                          }
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#10b981"
                          fontSize={10}
                          tickLine={false}
                          unit={t("overclock.chart.unitGB")}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#3b82f6"
                          fontSize={10}
                          tickLine={false}
                          unit={t("overclock.chart.unitTPS")}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px",
                          }}
                          labelFormatter={(val) =>
                            val >= 1024
                              ? `Context: ${Math.round(val / 1024)}K`
                              : `Context: ${val}`
                          }
                        />

                        {/* 黃金推論區標示 ( ReferenceArea ) */}
                        <ReferenceArea
                          yAxisId="left"
                          x1={2048}
                          x2={8192}
                          fill="#10b981"
                          fillOpacity={0.06}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          strokeOpacity={0.3}
                        />

                        {/* 當前 Context 配置標示線 */}
                        <ReferenceLine
                          yAxisId="left"
                          x={contextSlider}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          label={{
                            value: t("overclock.chart.currentConfig"),
                            position: "insideTopLeft",
                            fill: "#f59e0b",
                            fontSize: 11,
                          }}
                        />

                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="memoryDemand"
                          name={t("overclock.chart.memoryDemand")}
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorMemory)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="tokensPerSecond"
                          name={t("overclock.chart.tokensPerSecond")}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSpeed)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </section>

          {/* === 4. 產品核心亮點展示區 (`#features`) === */}
          <FeaturesSection />

          {/* === 5. 常見問題 FAQ 區塊 (`#faq`) === */}
          <FaqSection openIndex={openFaq} onToggle={setOpenFaq} />
        </main>
      </div>

      {/* === 6. 生產級 4 欄式頁尾 (Footer) === */}
      <Footer githubRepo={GITHUB_REPO} onNavigate={scrollToSection} />

      {/* 浮動式批次測試日誌終端機 (Log Terminal Modal) */}
      <TestLogModal
        open={testingApi.showLogs}
        logs={testingApi.testLogs}
        isTesting={testingApi.isTesting}
        onClose={() => testingApi.setShowLogs(false)}
      />
    </div>
  );
}
