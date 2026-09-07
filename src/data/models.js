/**
 * Static fixture data.
 *
 * MOCK_MODELS mirrors the shape returned by the Ollama `/api/ps`-style
 * endpoint so the UI is testable without a running server. These contain
 * DYNAMIC API data (model names, families, sizes) and are NOT i18n keys —
 * they are rendered verbatim per the i18n plan.
 *
 * FAQ_ITEMS has been externalized to locale JSON (src/i18n/locales/*.json)
 * under the `faq.*` keys and is no longer exported from this file.
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

// FAQ_ITEMS has been externalized to locale JSON (src/i18n/locales/*.json).
