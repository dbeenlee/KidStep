"use client"

import { Trash2, FileText, Camera, BarChart3 } from "lucide-react"
import dayjs from "dayjs"

/** 里程碑数据类型 */
interface MilestoneData {
  id: string
  type: string
  content: string | null
  mediaUrls: string | null
  createdAt: string
}

interface TimelineItemProps {
  milestone: MilestoneData
  onDelete: (id: string) => void
}

/** 类型配置 */
const typeConfig: Record<
  string,
  { icon: typeof FileText; color: string; label: string }
> = {
  TEXT: { icon: FileText, color: "#4CAF50", label: "文字记录" },
  PHOTO: { icon: Camera, color: "#FF9800", label: "照片" },
  ASSESSMENT: { icon: BarChart3, color: "#2196F3", label: "评估记录" },
}

export function TimelineItem({ milestone, onDelete }: TimelineItemProps) {
  const config = typeConfig[milestone.type] ?? typeConfig.TEXT
  const Icon = config.icon

  return (
    <div className="relative">
      {/* 时间线圆点 */}
      <div
        className="absolute -left-[31px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: config.color }}
      />

      {/* 内容卡片 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: config.color + "20" }}
            >
              <Icon size={14} style={{ color: config.color }} />
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: config.color + "15",
                color: config.color,
              }}
            >
              {config.label}
            </span>
          </div>

          <button
            onClick={() => onDelete(milestone.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
          </button>
        </div>

        {milestone.content && (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {milestone.content}
          </p>
        )}

        {/* 照片展示 */}
        {milestone.type === "PHOTO" && milestone.mediaUrls && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {(() => {
              try {
                const urls: string[] = JSON.parse(milestone.mediaUrls)
                return urls.map((url, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center"
                  >
                    <Camera size={20} className="text-gray-400" />
                  </div>
                ))
              } catch {
                return null
              }
            })()}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {dayjs(milestone.createdAt).format("MM月DD日 HH:mm")}
        </p>
      </div>
    </div>
  )
}
