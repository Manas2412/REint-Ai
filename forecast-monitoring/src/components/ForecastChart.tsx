"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export type SeriesPoint = {
  time: string; // ISO string
  actual?: number;
  forecast?: number;
};

export type ForecastChartProps = {
  data: SeriesPoint[];
  horizonHours: number;
};

function formatTooltipLabel(value: unknown) {
  const str = typeof value === "string" ? value : String(value);
  const d = new Date(str);
  return d.toISOString().replace("T", " ").replace("Z", "");
}

export function ForecastChart({ data, horizonHours }: ForecastChartProps) {
  return (
    <div style={{ width: "100%", height: 420, minWidth: 0, minHeight: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getUTCHours()}:00`;
            }}
            minTickGap={40}
          />
          <YAxis
            label={{ value: "Power (MW)", angle: -90, position: "insideLeft" }}
            width={60}
          />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={(value: unknown) => {
              if (value == null) return "-";
              const n = Number(String(value));
              return Number.isFinite(n) ? n.toFixed(0) : String(value);
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#1f77b4"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name={`Forecast (horizon ${horizonHours}h)`}
            stroke="#2ca02c"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
