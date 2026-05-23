"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface TypeDistribution {
  type: string
  count: number
  completed: number
}

interface DistributionChartProps {
  data: TypeDistribution[]
}

const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0"]

const TYPE_LABELS: Record<string, string> = {
  HABIT: "习惯养成",
  ABILITY: "能力训练",
  BONDING: "亲子互动",
  KNOWLEDGE: "知识学习",
}

/** 任务类型分布饼图 */
export default function DistributionChart({ data }: DistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
        暂无数据
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ type, percent }) =>
            `${TYPE_LABELS[type] ?? type} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            value,
            TYPE_LABELS[name] ?? name,
          ]}
          contentStyle={{
            borderRadius: 8,
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value: string) => TYPE_LABELS[value] ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
