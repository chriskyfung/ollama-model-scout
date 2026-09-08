import { useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FaqSection from "@/components/dashboard/FaqSection";
import TestLogModal from "@/components/dashboard/TestLogModal";
import ConnectionBanner from "@/components/dashboard/ConnectionBanner";
import ApiSettingsPanel from "@/components/dashboard/ApiSettingsPanel";
import ModelSearchToolbar from "@/components/dashboard/ModelSearchToolbar";
import FilterButtonBar from "@/components/dashboard/FilterButtonBar";
import ModelsTable from "@/components/dashboard/ModelsTable";
import OverclockPanel from "@/components/dashboard/OverclockPanel";
import FeaturesSection from "@/components/dashboard/FeaturesSection";
import { GITHUB_REPO, STORAGE_KEYS, DEFAULT_HARDWARE } from "@/lib/constants";
import { useModels } from "@/hooks/useModels";
import { useModelFilters } from "@/hooks/useModelFilters";
import { useModelTesting } from "@/hooks/useModelTesting";
import { useOverclockPlanner } from "@/hooks/useOverclockPlanner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function App() {
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // --- State: Tactical Command Center panel ---

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

  // --- Tactical Command Center (selected model + context slider + chart) ---
  const overclockApi = useOverclockPlanner(hardware);

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
            <OverclockPanel
              model={overclockApi.selectedModel}
              onClose={() => overclockApi.setSelectedModel(null)}
              contextSlider={overclockApi.contextSlider}
              setContextSlider={overclockApi.setContextSlider}
              hardware={hardware}
              chartData={overclockApi.chartData}
            />
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
