import { useState, useMemo, useEffect } from "react";
import { calculatePerformance } from "@/lib/perf";
import { buildChartData } from "@/lib/models";

/**
 * "Tactical Command Center" (overclock planner) hook: selected model,
 * context slider, and derived performance-chart data.
 *
 * Semantics preserved verbatim from App.jsx, including the intentional
 * synchronous setState effects (documented in the comments they were moved
 * with).
 */
export function useOverclockPlanner(hardware) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [contextSlider, setContextSlider] = useState(8192);

  // When the user selects a model, reset the context slider to a balanced
  // default. Intentional synchronous setState inside a change-driven effect.
  //
  // Edge cases (both intentional):
  // - Deselect (null) leaves the slider at its last value; it resets on the
  //   next selection since null → model is always a reference change..
  // - Re-selecting the *same* model object while already selected is a no-op
  //   (Object.is bail-out): no effect run, so a user-dragged slider value is
  //   preserved rather than snapped back to the default.
  useEffect(() => {
    if (selectedModel) {
      const defaultCtx = Math.min(
        8192,
        selectedModel.details?.context_length || 8192,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived default sync
      setContextSlider(defaultCtx);
    }
  }, [selectedModel]);

  const chartData = useMemo(
    () => buildChartData(selectedModel, hardware, calculatePerformance),
    [selectedModel, hardware],
  );

  return {
    selectedModel,
    setSelectedModel,
    contextSlider,
    setContextSlider,
    chartData,
  };
}
