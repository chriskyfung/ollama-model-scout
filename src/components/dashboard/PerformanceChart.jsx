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

/**
 * Golden-inference-zone performance chart (Recharts). Extracted verbatim
 * from App.jsx; receives precomputed chartData + the current context value.
 */
export default function PerformanceChart({ chartData, contextSlider }) {
  const { t } = useTranslation();
  return (
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
  );
}
