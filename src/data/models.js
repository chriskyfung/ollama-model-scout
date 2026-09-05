/**
 * Static fixture data.
 *
 * MOCK_MODELS mirrors the shape returned by the Ollama `/api/ps`-style
 * endpoint so the UI is testable without a running server. These contain
 * DYNAMIC API data (model names, families, sizes) and are NOT i18n keys —
 * they are rendered verbatim per the i18n plan.
 *
 * FAQ_ITEMS is intentionally co-located here; when i18n lands, the questions
 * and answers will be externalized to locale JSON and this file becomes a
 * structural index only.
 */

export const MOCK_MODELS = [
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

export const FAQ_ITEMS = [
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
