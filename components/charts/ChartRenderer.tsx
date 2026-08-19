"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_PALETTE, BRAND_COLORS } from "@/lib/colors";

type ChartItem = {
  id: string;
  subtype: string;
  title: string;
  chart: {
    type: string;
    data: any[];
    unit?: string;
    x_label?: string;
    y_label?: string;
  };
  question: string;
};

export default function ChartRenderer({ item }: { item: ChartItem }) {
  const { type, data, unit } = item.chart;

  const renderChart = () => {
    switch (type) {
      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={type === "donut" ? 60 : 0}
                label={(entry: any) => `${entry.label}: ${entry.value}${unit || ""}`}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={BRAND_COLORS.navy} radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "horizontal_bar":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="value" fill={BRAND_COLORS.red} radius={[0, 4, 4, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={BRAND_COLORS.blue}
                strokeWidth={3}
                dot={{ r: 5, fill: BRAND_COLORS.red }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_COLORS.blue} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={BRAND_COLORS.cyan} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={BRAND_COLORS.blue}
                strokeWidth={2}
                fill="url(#areaColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "comparison_bar": {
        const keys = Object.keys(data[0]).filter((k) => k !== "label");
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {keys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "stacked_bar": {
        const keys = Object.keys(data[0]).filter((k) => k !== "label");
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {keys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name={item.chart.x_label} />
              <YAxis dataKey="y" name={item.chart.y_label} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={data} fill={BRAND_COLORS.red} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-brand-gray-600">지원하지 않는 차트 타입: {type}</div>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-brand-navy text-white rounded-md mb-2">
          {item.subtype.replace(/_/g, " ").toUpperCase()}
        </span>
        <h3 className="text-lg font-bold text-brand-gray-900">{item.title}</h3>
      </div>
      {renderChart()}
      <div className="mt-4 pt-4 border-t border-brand-gray-200">
        <p className="text-sm text-brand-gray-700">
          <span className="font-semibold text-brand-red">Q.</span> {item.question}
        </p>
      </div>
    </div>
  );
}
