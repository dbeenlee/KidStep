"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DailyTrend {
  date: string
  total: number
  completed: number
}

interface TrendChartProps {
  data: DailyTrend[]
  isDark: boolean
}

/** 每日完成趋势折线图 */
export default function TrendChart({ data, isDark }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
        暂无数据
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? "#374151" : "#e5e7eb"}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={v => v.slice(5)}
          tick={{ fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
          labelFormatter={l => `日期: ${l}`}
        />
        <Line
          type="monotone"
          dataKey="completed"
          name="已完成"
          stroke="#4CAF50"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          name="总数"
          stroke={isDark ? "#4b5563" : "#e5e7eb"}
          strokeWidth={1}
          dot={false}
          strokeDasharray="4 4"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
