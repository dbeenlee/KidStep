"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"

interface RadarDataItem {
  dimension: string
  score: number
  fullMark: number
}

interface RadarChartSectionProps {
  data: RadarDataItem[]
}

/** 能力雷达图 */
export default function RadarChartSection({ data }: RadarChartSectionProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <Radar
          dataKey="score"
          stroke="#4CAF50"
          fill="#4CAF50"
          fillOpacity={0.25}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
