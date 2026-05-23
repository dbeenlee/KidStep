"use client"

import { useState } from "react"
import { Trash2, FileText, Camera, BarChart3, X } from "lucide-react"
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  /** 解析 mediaUrls */
  function parseUrls(): string[] {
    if (!milestone.mediaUrls) return []
    try {
      return JSON.parse(milestone.mediaUrls)
    } catch {
      return []
    }
  }

  const urls = parseUrls()

  return (
    <>
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
          {milestone.type === "PHOTO" && urls.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {urls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={url}
                    alt={`照片 ${i + 1}`}
                    className="w-16 h-16 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {dayjs(milestone.createdAt).format("MM月DD日 HH:mm")}
          </p>
        </div>
      </div>

      {/* 大图预览模态框 */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>

          <img
            src={urls[lightboxIndex]}
            alt={`照片 ${lightboxIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* 左右切换按钮 */}
          {urls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={e => {
                  e.stopPropagation()
                  setLightboxIndex(prev =>
                    prev !== null ? (prev - 1 + urls.length) % urls.length : null
                  )
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-colors"
              >
                上一张
              </button>
              <span className="px-3 py-1 text-white/70 text-sm">
                {lightboxIndex + 1} / {urls.length}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setLightboxIndex(prev =>
                    prev !== null ? (prev + 1) % urls.length : null
                  )
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm transition-colors"
              >
                下一张
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
