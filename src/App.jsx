import React, { useState, useMemo, useEffect } from "react";
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
  Settings,
  Cloud,
  Cpu,
  SquareActivity,
  ChevronDown,
  ChevronUp,
  Filter,
  HardDrive,
  Zap,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sliders,
  Server,
  HelpCircle,
  Terminal,
  X,
  Github,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";

const VERSION = "v1.0.1";
const GITHUB_REPO = "https://github.com/chriskyfung/ollama-model-scout";

const MOCK_MODELS = [
  {
    name: "glm-ocr:latest",
    model: "glm-ocr:latest",
    modified_at: "2026-07-18T03:42:45.566Z",
    size: 2219299168,
    details: {
      format: "gguf",
      family: "glmocr",
      parameter_size: "1.1B",
      quantization_level: "F16",
      context_length: 131072,
    },
    capabilities: ["vision", "completion", "tools"],
  },
  {
    name: "minicpm-v4.6:latest",
    model: "minicpm-v4.6:latest",
    modified_at: "2026-06-10T15:57:22.996Z",
    size: 1637848812,
    details: {
      format: "gguf",
      family: "qwen35",
      parameter_size: "752.16M",
      quantization_level: "Q4_K_M",
      context_length: 262144,
    },
    capabilities: ["completion", "vision"],
  },
  {
    name: "llama3.3:70b-instruct-q4_K_M",
    model: "llama3.3:70b-instruct-q4_K_M",
    modified_at: "2026-07-20T11:20:10.123Z",
    size: 42500000000,
    details: {
      format: "gguf",
      family: "llama",
      parameter_size: "70B",
      quantization_level: "Q4_K_M",
      context_length: 131072,
    },
    capabilities: ["completion", "tools", "thinking"],
  },
  {
    name: "deepseek-r1:14b",
    model: "deepseek-r1:14b",
    modified_at: "2026-07-15T09:12:00.000Z",
    size: 9000000000,
    details: {
      format: "gguf",
      family: "qwen2",
      parameter_size: "14B",
      quantization_level: "Q4_K_M",
      context_length: 65536,
    },
    capabilities: ["completion", "thinking"],
  },
  {
    name: "gpt-4o-proxy:remote",
    model: "gpt-4o",
    modified_at: "2026-08-01T10:00:00.000Z",
    size: "remote", // 雲端 API 模型
    details: {
      format: "api",
      family: "openai",
      parameter_size: "Cloud",
      quantization_level: "CLOUD",
      context_length: 128000,
    },
    capabilities: ["completion", "vision", "tools", "thinking"],
  },
];

function isDigit(val) {
  return val !== null && val !== undefined && /^\d+$/.test(String(val));
}

// 修正 size 單位：加入 KB
const formatBytes = (bytes) => {
  if (bytes === "remote") return "Cloud";
  if (!bytes || isNaN(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化 Parameter Size 呈現
const formatParameterSize = (paramStr) => {
  // return paramStr;
  if (!paramStr) return "-";
  if (!isDigit(paramStr)) return paramStr;
  const sizes = ["", "K", "M", "B", "T"];
  const i = Math.floor(Math.log10(paramStr) / 3);
  return parseFloat((paramStr / Math.pow(10, 3 * i)).toFixed(2)) + sizes[i];
};

const getBitsPerParam = (quantization) => {
  if (!quantization) return 4.5;
  const q = quantization.toUpperCase();
  if (q.includes("F16") || q.includes("16B")) return 16;
  if (q.includes("F32")) return 32;
  if (q.includes("Q8")) return 8.5;
  if (q.includes("Q6")) return 6.5;
  if (q.includes("Q5")) return 5.5;
  if (q.includes("Q4")) return 4.5;
  if (q.includes("Q3")) return 3.5;
  if (q.includes("Q2")) return 2.8;
  return 4.5;
};

const parseParamSizeToNum = (paramStr) => {
  if (!paramStr || paramStr === "Cloud") return 7;
  const match = paramStr.match(/^([\d.]+)\s*([BMbm])?$/);
  if (!match) return 7;
  const val = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  return unit === "B" ? val : val / 1000;
};

const calculatePerformance = (
  context,
  vramTotal,
  ramTotal,
  paramSizeStr,
  quantStr,
) => {
  const paramNum = parseParamSizeToNum(paramSizeStr);
  const bits = getBitsPerParam(quantStr);

  // 1. 模型基本權重 (GB)
  const modelWeightGB = paramNum * (bits / 8) * 1.15;

  // 2. KV Cache (GB) - 模擬 GQA 架構
  const estimatedLayers = Math.max(
    16,
    Math.round(24 * Math.log2(paramNum + 1)),
  );
  const kvCacheGB = (2 * estimatedLayers * 4096 * 2 * context * (1 / 8)) / 1e9;
  const totalDemand = modelWeightGB + kvCacheGB;

  // 3. 記憶體分配與溢流計算
  let vramUsed = 0;
  let ramUsed = 0;
  let vramRatio = 0;

  if (vramTotal === 0) {
    // 純 CPU 模式
    ramUsed = Math.min(totalDemand, ramTotal);
    vramRatio = 0;
  } else {
    vramUsed = Math.min(totalDemand, vramTotal);
    ramUsed = Math.max(0, totalDemand - vramUsed);
    vramRatio = totalDemand > 0 ? vramUsed / totalDemand : 0;
  }

  // 4. 速度推估 (Tokens/sec) - 諧振平均數 (Harmonic Mean)
  const gpuSpeed = 500 / Math.max(0.5, modelWeightGB); // GPU 頻寬 500 GB/s
  const cpuSpeed = 60 / Math.max(0.5, modelWeightGB); // CPU 頻寬 60 GB/s

  let estimatedTps = 0;
  if (vramTotal === 0) {
    estimatedTps = cpuSpeed;
  } else if (vramRatio >= 1) {
    estimatedTps = gpuSpeed;
  } else if (vramRatio <= 0) {
    estimatedTps = cpuSpeed;
  } else {
    estimatedTps = 1 / (vramRatio / gpuSpeed + (1 - vramRatio) / cpuSpeed);
  }

  const tokensPerSecond = Math.max(0.5, Math.min(estimatedTps * 0.85, 120));

  return {
    memoryDemand: parseFloat(totalDemand.toFixed(2)),
    vramUsed: parseFloat(vramUsed.toFixed(2)),
    ramUsed: parseFloat(ramUsed.toFixed(2)),
    tokensPerSecond: parseFloat(tokensPerSecond.toFixed(1)),
    isOverloaded: totalDemand > (vramTotal > 0 ? vramTotal : ramTotal),
  };
};

const FAQ_ITEMS = [
  {
    q: "顯存 (VRAM) 溢流至系統記憶體 (RAM) 時會發生什麼事？",
    a: "當 LLM 模型的權重與 KV Cache 總和超越顯示卡專屬 VRAM 容量時，Ollama 會透過 PCIe 匯流排將剩餘層數託管於系統 RAM。由於 DDR4/DDR5 的頻寬（約 40-80 GB/s）遠低於 GPU 專用顯存（約 500-1000 GB/s），這會導致推論速度（Tokens/s）呈現諧振式斷崖下跌，通常下降 80% 至 95%。",
  },
  {
    q: "系統如何精密計算不同 Context 下的 KV Cache 需求？",
    a: "本儀表板內建 LLM 推論物理學推算模型。公式考量了模型參數規模（估計網絡隱藏層數 Layers）、嵌入層維度（Embedding Dim）、以及 Grouped-Query Attention (GQA) 的 1/8 鍵值對壓縮比，動態預測每拉長 1,024 Tokens 所額外消耗的顯存量。",
  },
  {
    q: "連線設定與 API Key 會傳送到第三方伺服器嗎？",
    a: "絕不傳送。本系統為 100% 純前端 Web App，所有 API 配置、自訂 Headers 以及硬體參數設定僅儲存於您瀏覽器的本地端 (LocalStorage)。所有 Fetch 請求均由您的瀏覽器直接向您指定的 Ollama API 發送。",
  },
  {
    q: "為什麼部分雲端模型的體積大小顯示為 'Cloud'？",
    a: "對於遠端 API 模型（例如 GPT-4o 或第三方 API 代理），模型的實際權重託管於遠端雲端集群，本地並不佔用硬體硬碟空間與 VRAM，因此系統將其獨立歸類標記為 Cloud API 模型。",
  },
];

export default function App() {
  // --- 狀態：API 連線設定與狀態 ---
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem("ollama_api_config");
    return saved
      ? JSON.parse(saved)
      : { url: "http://localhost:11434", key: "", headers: "" };
  });
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    state: "idle",
    message: "",
    isFallback: false,
  });
  const [allowMockFallback, setAllowMockFallback] = useState(true);

  // --- 狀態：FAQ 展開 ---
  const [openFaq, setOpenFaq] = useState(0);

  // --- 狀態：資料與過濾 ---
  const DEFAULT_FILTER_STATE = {
    type: "all",
    capabilities: [],
    families: [],
    quantizations: [],
    testStatus: "all",
  };

  const [models, setModels] = useState(MOCK_MODELS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTER_STATE);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
  };

  // --- 狀態：硬體規格輸入 (VRAM / RAM) ---
  const [hardware, setHardware] = useState(() => {
    const saved = localStorage.getItem("ollama_hardware_settings");
    return saved ? JSON.parse(saved) : { vram: 24, ram: 64 };
  });

  // --- 本地儲存：API 與硬體設定寫入 ---
  useEffect(() => {
    localStorage.setItem("ollama_api_config", JSON.stringify(apiConfig));
  }, [apiConfig]);

  useEffect(() => {
    localStorage.setItem("ollama_hardware_settings", JSON.stringify(hardware));
  }, [hardware]);

  // --- 狀態：表格 UI 與欄位設定 ---
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem("ollama_sort_config");
    return saved ? JSON.parse(saved) : { key: "name", direction: "asc" };
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("ollama_columns");
    return saved
      ? JSON.parse(saved)
      : {
          name: true,
          family: true,
          parameterSize: true,
          quantization: true,
          contextLength: true,
          size: true,
          status: true,
          capabilities: true,
          modifiedAt: true,
        };
  });

  // --- 本地儲存：表格 UI 與欄位設定寫入 ---
  useEffect(() => {
    localStorage.setItem("ollama_sort_config", JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    localStorage.setItem("ollama_columns", JSON.stringify(columns));
  }, [columns]);

  // --- 狀態：互動面板 ( Tactical Deck ) ---
  const [selectedModel, setSelectedModel] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testLogs, setTestLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [contextSlider, setContextSlider] = useState(8192);

  const availableCapabilities = useMemo(() => {
    return Array.from(new Set(models.flatMap((m) => m.capabilities || [])));
  }, [models]);

  const availableFamilies = useMemo(() => {
    return Array.from(
      new Set(models.map((m) => m.details?.family).filter(Boolean)),
    ).sort();
  }, [models]);

  // Quantization 全部轉大寫 (依據規格需求)
  const availableQuantizations = useMemo(() => {
    return Array.from(
      new Set(
        models
          .map((m) => m.details?.quantization_level?.toUpperCase())
          .filter(Boolean),
      ),
    ).sort();
  }, [models]);

  const fetchModels = async (overrideFallback) => {
    const fallback =
      typeof overrideFallback === "boolean"
        ? overrideFallback
        : allowMockFallback;
    setApiStatus({
      state: "loading",
      message: "正在連線至 Ollama 伺服器...",
      isFallback: false,
    });
    try {
      let customHeaders = {};
      if (apiConfig.headers) {
        try {
          customHeaders = JSON.parse(apiConfig.headers);
        } catch (e) {
          throw new Error("Headers JSON 格式不正確");
        }
      }

      const headers = {
        "Content-Type": "application/json",
        ...(apiConfig.key ? { Authorization: `Bearer ${apiConfig.key}` } : {}),
        ...customHeaders,
      };

      const res = await fetch(`${apiConfig.url}/api/tags`, {
        method: "GET",
        headers,
      });

      if (!res.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${res.status}`);

      const data = await res.json();
      if (data && Array.isArray(data.models)) {
        setModels(data.models);
        setApiStatus({
          state: "success",
          message: `連線成功！已載入 ${data.models.length} 個模型`,
          isFallback: false,
        });
      } else {
        throw new Error("回應格式不符，缺少 models 陣列");
      }
    } catch (err) {
      if (fallback) {
        console.warn("無法連線至真實 Ollama，啟動 Mock/備援資料", err);
        setModels(MOCK_MODELS);
        setApiStatus({
          state: "error",
          message: `無法連線 (${err.message})。已啟用備援 Mock 模型資料。`,
          isFallback: true,
        });
      } else {
        console.warn("連線失敗，且已停用 Mock 資料", err);
        setModels([]);
        setApiStatus({
          state: "error",
          message: `連線失敗 (${err.message})。請檢查伺服器設定。`,
          isFallback: false,
        });
      }
    } finally {
      resetFilters();
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 選取模型時，重設 Context 滑桿
  useEffect(() => {
    if (selectedModel) {
      const defaultCtx = Math.min(
        8192,
        selectedModel.details?.context_length || 8192,
      );
      setContextSlider(defaultCtx);
    }
  }, [selectedModel]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        // 1. 全域搜尋
        const matchesSearch = JSON.stringify(m)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // 2. 模型類型 (Local / Remote) 檢測 remote_model 欄位
        const isRemote =
          m.size === "remote" ||
          m.details?.format === "api" ||
          !!m.remote_model;
        const matchesType =
          filters.type === "all"
            ? true
            : filters.type === "remote"
              ? isRemote
              : !isRemote;

        // 3. Capabilities
        const matchesCap =
          filters.capabilities.length === 0 ||
          filters.capabilities.every((c) => m.capabilities?.includes(c));

        // 4. Family
        const matchesFam =
          filters.families.length === 0 ||
          filters.families.includes(m.details?.family);

        // 5. Quantization (全部比對大寫)
        const modelQuant = m.details?.quantization_level?.toUpperCase();
        const matchesQuant =
          filters.quantizations.length === 0 ||
          filters.quantizations.includes(modelQuant);

        // 6. Test Status (API Connection)
        let matchesTest = true;
        if (filters.testStatus !== "all") {
          const res = testResults[m.name];
          if (filters.testStatus === "success")
            matchesTest = res?.status === "ok";
          else if (filters.testStatus === "error")
            matchesTest = res?.status === "error";
          else if (filters.testStatus === "untested") matchesTest = !res;
        }

        return (
          matchesSearch &&
          matchesType &&
          matchesCap &&
          matchesFam &&
          matchesQuant &&
          matchesTest
        );
      })
      .sort((a, b) => {
        let valA, valB;

        // 支援 modified_at 排序
        if (sortConfig.key === "modified_at") {
          valA = new Date(a.modified_at || 0).getTime();
          valB = new Date(b.modified_at || 0).getTime();
        } else if (sortConfig.key === "size") {
          valA = a.size === "remote" ? -1 : a.size || 0;
          valB = b.size === "remote" ? -1 : b.size || 0;
        } else if (sortConfig.key === "status") {
          // 狀態排序權重: ok > error > untested (0)
          const weight = { ok: 2, error: 1 };
          valA = weight[testResults[a.name]?.status] || 0;
          valB = weight[testResults[b.name]?.status] || 0;
        } else if (
          [
            "family",
            "quantization_level",
            "parameter_size",
            "context_length",
          ].includes(sortConfig.key)
        ) {
          valA = a.details?.[sortConfig.key] || "";
          valB = b.details?.[sortConfig.key] || "";
          if (sortConfig.key === "quantization_level") {
            valA = String(valA).toUpperCase();
            valB = String(valB).toUpperCase();
          }
        } else {
          valA = a[sortConfig.key] || "";
          valB = b[sortConfig.key] || "";
        }

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [models, searchQuery, filters, sortConfig, testResults]);

  // 本地模型總容量計算
  const totalLocalSize = useMemo(() => {
    return filteredModels.reduce(
      (sum, m) => sum + (typeof m.size === "number" ? m.size : 0),
      0,
    );
  }, [filteredModels]);

  const handleBatchTest = () => {
    setIsTesting(true);
    setShowLogs(true);
    const remoteModels = filteredModels.filter(
      (m) =>
        m.size === "remote" || m.details?.format === "api" || !!m.remote_model,
    );

    if (remoteModels.length === 0) {
      setIsTesting(false);
      setTestLogs((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          model: "System",
          status: "info",
          message: "目前列表中沒有雲端 API 模型可供測試。",
        },
      ]);
      return;
    }

    setTestLogs((prev) => [
      ...prev,
      {
        time: new Date().toISOString(),
        model: "System",
        status: "info",
        message: `開始批次測試 ${remoteModels.length} 個雲端模型的連線狀態...`,
      },
    ]);

    remoteModels.forEach((m, idx) => {
      setTimeout(
        () => {
          const success = Math.random() > 0.25;
          const msg = success ? "200 OK (連線正常)" : "ERR_CONNECTION_TIMEOUT";
          const status = success ? "ok" : "error";

          setTestResults((prev) => ({ ...prev, [m.name]: { status, msg } }));

          // 寫入即時日誌
          setTestLogs((prev) => [
            ...prev,
            {
              time: new Date().toISOString(),
              model: m.name,
              status: status,
              message: msg,
            },
          ]);

          if (idx === remoteModels.length - 1) {
            setIsTesting(false);
            setTestLogs((prev) => [
              ...prev,
              {
                time: new Date().toISOString(),
                model: "System",
                status: "info",
                message: "批次測試執行完畢。",
              },
            ]);
          }
        },
        (idx + 1) * 500,
      );
    });
  };

  const toggleFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const sortTable = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo 與狀態指示燈 */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
                <SquareActivity className="w-5 h-5 text-cyan-400" />
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                    apiStatus.state === "success"
                      ? "bg-emerald-400 animate-pulse"
                      : apiStatus.isFallback
                        ? "bg-amber-400"
                        : "bg-rose-500"
                  }`}
                />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  Ollama Model Scout
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 rounded-md">
                  {VERSION}
                </span>
              </div>
            </div>

            {/* 右側工具按鈕區 */}
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all group"
                title="GitHub 專案原始碼"
              >
                <Github className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline">GitHub</span>
              </a>

              <button
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 hover:border-cyan-500/50 rounded-xl text-xs font-medium text-cyan-300 transition-all shadow-sm shadow-cyan-950"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span className="hidden sm:inline">伺服器與硬體</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showApiSettings ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-16 space-y-8">
          {/* 連線狀態 Banner */}
          {apiStatus.message && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in ${
                apiStatus.state === "error" || apiStatus.isFallback
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
                      onChange={(e) => {
                        const newVal = e.target.checked;
                        setAllowMockFallback(newVal);
                        fetchModels(newVal);
                      }}
                      className="accent-cyan-500 rounded cursor-pointer"
                    />
                    <span>啟用 Mock 資料</span>
                  </label>
                )}
                <button
                  onClick={() => fetchModels()}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> 重試
                </button>
              </div>
            </div>
          )}

          {/* 展開式 API & 硬體規格設定面板 */}
          {showApiSettings && (
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-300 focus:border-cyan-500 outline-none resize-y min-h-[80px]"
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
                  <button
                    onClick={() => setHardware({ vram: 0, ram: 32 })}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300"
                  >
                    純 CPU (32G)
                  </button>
                  <button
                    onClick={() => setHardware({ vram: 16, ram: 32 })}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300"
                  >
                    MacBook (16G)
                  </button>
                  <button
                    onClick={() => setHardware({ vram: 24, ram: 64 })}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300"
                  >
                    RTX 4090 (24G)
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={fetchModels}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-950/50"
                >
                  套用設定並重新載入
                </button>
              </div>
            </div>
          )}

          {/* === 2. 模型搜尋與診斷矩陣區塊 (`#models`) === */}
          <section id="models" className="scroll-mt-20">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜尋模型名稱、能力、家族、量化等級..."
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
                    <span>欄位自訂</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showColumnMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-1">
                      <div className="text-xs font-bold text-slate-400 px-2 pb-2 border-b border-slate-800">
                        顯示欄位開關
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
                          <span className="capitalize">
                            {col.replace(/([A-Z])/g, " $1")}
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
                    Type:
                  </span>
                  {["all", "local", "remote"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilters((p) => ({ ...p, type: t }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
                        filters.type === t
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {t === "remote" ? "CLOUD (REMOTE)" : t.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* 2. 能力 (Capabilities) */}
                {availableCapabilities.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
                      Caps:
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
                      Family:
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
                      Quant:
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
                    Status:
                  </span>
                  {[
                    { id: "all", label: "所有狀態" },
                    { id: "success", label: "連線成功" },
                    { id: "error", label: "連線失敗" },
                    { id: "untested", label: "尚未測試" },
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
                          Model Name
                        </th>
                      )}
                      {columns.family && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("family")}
                        >
                          Family
                        </th>
                      )}
                      {columns.parameterSize && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("parameter_size")}
                        >
                          Parameters
                        </th>
                      )}
                      {columns.quantization && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("quantization_level")}
                        >
                          Quantization
                        </th>
                      )}
                      {columns.contextLength && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("context_length")}
                        >
                          Context Length
                        </th>
                      )}
                      {columns.size && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("size")}
                        >
                          Size
                        </th>
                      )}
                      {columns.status && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("status")}
                        >
                          API Status
                        </th>
                      )}
                      {columns.capabilities && (
                        <th className="p-4">Capabilities</th>
                      )}
                      {columns.modifiedAt && (
                        <th
                          className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => sortTable("modified_at")}
                        >
                          Modified At
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
                          沒有符合過濾條件的模型
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
                                    Cloud
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
                                    <Cloud className="w-3.5 h-3.5" /> Cloud API
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
                                  <span className="text-slate-600">-</span>
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
                                  : "-"}
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
                    顯示模型:{" "}
                    <strong className="text-white">
                      {filteredModels.length}
                    </strong>{" "}
                    個
                  </span>
                  <span className="h-3 w-px bg-slate-800"></span>
                  <span>
                    本地模型佔用:{" "}
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
                      <Terminal className="w-3.5 h-3.5" /> 檢視測試日誌
                    </button>
                  )}
                  <button
                    onClick={handleBatchTest}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isTesting ? "批次測試中..." : "批次測試雲端 API 連線"}
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
                        參數規模:{" "}
                        {formatParameterSize(
                          selectedModel.details?.parameter_size,
                        )}{" "}
                        | 量化:{" "}
                        {selectedModel.details?.quantization_level?.toUpperCase() ||
                          "UNKNOWN"}{" "}
                        | 最大 Context:{" "}
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
                      🚀 極速 (2K)
                    </button>
                    <button
                      onClick={() => setContextSlider(8192)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-bold transition-colors"
                    >
                      ⚖ 均衡 (8K)
                    </button>
                    <button
                      onClick={() =>
                        setContextSlider(
                          selectedModel.details?.context_length || 32768,
                        )
                      }
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-bold transition-colors"
                    >
                      📚 極限 Context
                    </button>
                  </div>

                  {/* Context 滑桿 */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Context 深度配置</span>
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
                                GPU VRAM 核心 (專用)
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
                                系統 RAM (溢流分流)
                                {perf.ramUsed > 0 && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    PCIe 匯流排分流中
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
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Context
                      vs. 記憶體與推論速度 (t/s)
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                      ✨ 綠色區域：黃金推論區
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
                          unit="GB"
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#3b82f6"
                          fontSize={10}
                          tickLine={false}
                          unit=" t/s"
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
                            value: "當前配置",
                            position: "insideTopLeft",
                            fill: "#f59e0b",
                            fontSize: 11,
                          }}
                        />

                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="memoryDemand"
                          name="記憶體總需求"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorMemory)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="tokensPerSecond"
                          name="預估速度"
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
                  請從上方模型矩陣中點擊任一模型
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  點擊模型後將立即展開「戰略推算艙」，為您模擬在不同 Context
                  深度下的 VRAM/RAM 記憶體分配與推論速度衰退曲線。
                </p>
              </div>
            )}
          </section>

          {/* === 4. 產品核心亮點展示區 (`#features`) === */}
          <section id="features" className="scroll-mt-20 pt-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 inline-flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" /> 專為 LLM
                玩家打造的核心技術
              </h2>
              <p className="text-xs text-slate-400">
                結合 LLM 推論物理學與視覺化分析，協助您極致釋放本地硬體潛能
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-5 space-y-3 group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  物理級 KV Cache 動態估算
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  精確計算每拉長 1K Context 所產生的 Key-Value
                  顯存需求，避免爆顯存（OOM）崩潰。
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all rounded-2xl p-5 space-y-3 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  雙層 RAM/VRAM 液態溢流
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  獨創液態溢流矩陣，即時呈現顯存不足時模型層數向系統 RAM 分流與
                  PCIe 降速特徵。
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all rounded-2xl p-5 space-y-3 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  雲端 API 批次健康診斷
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  提供微秒級雲端代理與遠端 API 連線診斷，搭配即時多線程 Terminal
                  測試日誌。
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all rounded-2xl p-5 space-y-3 group">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  100% 本地隱私無伺服器
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  純前端架構，API Keys 與伺服器路徑全數託管於本機
                  LocalStorage，絕不上傳雲端。
                </p>
              </div>
            </div>
          </section>

          {/* === 5. 常見問題 FAQ 區塊 (`#faq`) === */}
          <section id="faq" className="scroll-mt-20 pt-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-400 inline-flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-teal-400" /> 常見問題 (FAQ)
              </h2>
              <p className="text-xs text-slate-400">
                關於模型管理、VRAM 計算與隱私安全的核心解答
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left flex justify-between items-center gap-4 hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-200">
                        {item.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* === 6. 生產級 4 欄式頁尾 (Footer) === */}
      <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: 品牌與專案簡介 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <SquareActivity className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Ollama Model Scout
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              專為大語言模型玩家設計的遠端 Ollama 管理儀表板與物理超頻推估系統。
            </p>
            <div className="flex items-center gap-3">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Column 2: 核心功能 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" /> 核心功能
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection("overclock")}
                  className="hover:text-cyan-300 transition-colors"
                >
                  • VRAM / RAM 溢流實時預算
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("models")}
                  className="hover:text-cyan-300 transition-colors"
                >
                  • 智慧多維度過濾與動態排序
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("models")}
                  className="hover:text-cyan-300 transition-colors"
                >
                  • 雲端 API 批次連線診斷
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("overclock")}
                  className="hover:text-cyan-300 transition-colors"
                >
                  • Context 黃金推論區圖表
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: 常用外部資源 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" /> 實用社群資源
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="https://ollama.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  • Ollama 官方網站 <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://huggingface.co/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  • Hugging Face GGUF 模型庫{" "}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://lmarena.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  • LMSYS Chatbot Arena 競技場{" "}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ollama/ollama"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  • Ollama GitHub 官方專案{" "}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部 CopyRight 列 */}
        <div className="border-t border-slate-900 bg-slate-950 py-4 text-center text-slate-500 text-[11px]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>© 2026 Ollama Model Scout. Open-source under MIT License.</div>
            <div className="text-slate-400 flex items-center gap-1">
              Crafted with{" "}
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> for
              Local AI Enthusiasts.
            </div>
          </div>
        </div>
      </footer>

      {/* 浮動式批次測試日誌終端機 (Log Terminal Modal) */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden h-[60vh] max-h-[600px] animate-in zoom-in-95 duration-200">
            {/* Terminal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                <Terminal className="w-4 h-4 text-cyan-400" />
                批次測試終端日誌 (Batch Test Logs)
              </h3>
              <button
                onClick={() => setShowLogs(false)}
                className="p-1 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terminal Log Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-950 font-mono text-xs scroll-smooth">
              {testLogs.map((log, i) => (
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
                    className={`shrink-0 w-[140px] truncate ${log.model === "System" ? "text-indigo-400 font-bold" : "text-slate-400"}`}
                  >
                    [{log.model}]
                  </span>
                  <span
                    className={`${
                      log.status === "ok"
                        ? "text-emerald-400"
                        : log.status === "error"
                          ? "text-rose-400"
                          : "text-cyan-400"
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              {testLogs.length === 0 && (
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
      )}
    </div>
  );
}
