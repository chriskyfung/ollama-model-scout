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
import ModelSearchToolbar from "@/components/dashboard/ModelSearchToolbar";
import FilterButtonBar from "@/components/dashboard/FilterButtonBar";
import ModelsTable from "@/components/dashboard/ModelsTable";
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
              <ModelSearchToolbar
                searchQuery={filtersApi.searchQuery}
                onSearchChange={filtersApi.setSearchQuery}
                columns={filtersApi.columns}
                onToggleColumn={(col) =>
                  filtersApi.setColumns((p) => ({ ...p, [col]: !p[col] }))
                }
                open={showColumnMenu}
                onOpenChange={setShowColumnMenu}
              />

              {/* 多維度智慧動態篩選按鈕列 */}
              <FilterButtonBar
                filters={filtersApi.filters}
                setFilters={filtersApi.setFilters}
                toggleFilter={filtersApi.toggleFilter}
                availableCapabilities={filtersApi.availableCapabilities}
                availableFamilies={filtersApi.availableFamilies}
                availableQuantizations={filtersApi.availableQuantizations}
              />
            </div>

            {/* 模型列表數據表格 */}
            <ModelsTable
              models={filtersApi.filteredModels}
              columns={filtersApi.columns}
              selectedModel={overclockApi.selectedModel}
              onSelect={overclockApi.setSelectedModel}
              sortTable={filtersApi.sortTable}
              testResults={testingApi.testResults}
              totalLocalSize={filtersApi.totalLocalSize}
              hasLogs={testingApi.testLogs.length > 0}
              onViewLogs={() => testingApi.setShowLogs(true)}
              isTesting={testingApi.isTesting}
              onBatchTest={() =>
                testingApi.handleBatchTest(filtersApi.filteredModels)
              }
            />
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
