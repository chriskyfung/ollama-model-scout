/**
 * LLM inference performance model: VRAM/RAM spillover + throughput estimation.
 *
 * Pure functions isolated from React so they can be tested and reused by the
 * i18n/localization layer (unit labels) without coupling to UI concerns.
 */
import { PERF } from "./constants";

export const getBitsPerParam = (quantization) => {
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

export const parseParamSizeToNum = (paramStr) => {
  if (!paramStr || paramStr === "Cloud") return 7;
  const match = String(paramStr).match(/^([\d.]+)\s*([BMbm])?$/);
  if (!match) return 7;
  const val = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  return unit === "B" ? val : val / 1000;
};

export const calculatePerformance = (
  context,
  vramTotal,
  ramTotal,
  paramSizeStr,
  quantStr,
) => {
  const paramNum = parseParamSizeToNum(paramSizeStr);
  const bits = getBitsPerParam(quantStr);

  const modelWeightGB = paramNum * (bits / 8) * PERF.WEIGHT_OVERHEAD;

  const estimatedLayers = Math.max(
    PERF.MIN_LAYERS,
    Math.round(PERF.LAYER_LOG_BASE * Math.log2(paramNum + 1)),
  );
  const kvCacheGB =
    (PERF.KV_RATIO *
      estimatedLayers *
      PERF.KV_HEAD_DIM *
      PERF.KV_RATIO *
      context *
      (1 / PERF.KV_GQA_COMPRESSION)) /
    1e9;
    const totalDemand = modelWeightGB + kvCacheGB;

  let vramUsed;
  let ramUsed;
  let vramRatio;

  if (vramTotal === 0) {
    vramUsed = 0;
    ramUsed = Math.min(totalDemand, ramTotal);
    vramRatio = 0;
  } else {
    vramUsed = Math.min(totalDemand, vramTotal);
    ramUsed = Math.max(0, totalDemand - vramUsed);
    vramRatio = totalDemand > 0 ? vramUsed / totalDemand : 0;
  }

  const gpuSpeed = PERF.GPU_BANDWIDTH / Math.max(0.5, modelWeightGB);
  const cpuSpeed = PERF.CPU_BANDWIDTH / Math.max(0.5, modelWeightGB);

  let estimatedTps;
  if (vramTotal === 0) {
    estimatedTps = cpuSpeed;
  } else if (vramRatio >= 1) {
    estimatedTps = gpuSpeed;
  } else if (vramRatio <= 0) {
    estimatedTps = cpuSpeed;
  } else {
    estimatedTps = 1 / (vramRatio / gpuSpeed + (1 - vramRatio) / cpuSpeed);
  }

  const tokensPerSecond = Math.max(
    0.5,
    Math.min(estimatedTps * PERF.TPS_EFFICIENCY, PERF.TPS_CEILING),
  );

  return {
    memoryDemand: parseFloat(totalDemand.toFixed(2)),
    vramUsed: parseFloat(vramUsed.toFixed(2)),
    ramUsed: parseFloat(ramUsed.toFixed(2)),
    tokensPerSecond: parseFloat(tokensPerSecond.toFixed(1)),
    isOverloaded: totalDemand > (vramTotal > 0 ? vramTotal : ramTotal),
  };
};
