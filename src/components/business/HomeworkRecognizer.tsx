"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Sparkles, Save, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** 组件属性 */
interface HomeworkRecognizerProps {
  childId: string
  onSave?: (analysis: string, imageUrl: string, file: File) => void
}

/** 识别结果类型 */
interface RecognitionResult {
  analysis: string
  suggestions: string[]
}

/** 组件状态 */
type RecognizerState = "idle" | "preview" | "recognizing" | "result"

export function HomeworkRecognizer({ childId: _childId, onSave }: HomeworkRecognizerProps) {
  const [state, setState] = useState<RecognizerState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 选择图片 */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 释放旧预览
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setState("preview")
  }, [previewUrl])

  /** 开始识别 */
  const handleRecognize = useCallback(async () => {
    if (!selectedFile) return

    setState("recognizing")
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? "识别失败，请稍后重试")
        setState("preview")
        return
      }

      setResult(data.data)
      setState("result")
    } catch {
      setError("网络错误，请稍后重试")
      setState("preview")
    }
  }, [selectedFile])

  /** 保存到成长档案 */
  const handleSave = useCallback(() => {
    if (!result || !previewUrl || !selectedFile) return
    onSave?.(result.analysis, previewUrl, selectedFile)
  }, [result, previewUrl, selectedFile, onSave])

  /** 重置状态 */
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setState("idle")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [previewUrl])

  return (
    <div className="space-y-4">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 空状态：选择图片 */}
      {state === "idle" && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#4CAF50] hover:text-[#4CAF50] transition-colors"
        >
          <Camera size={36} />
          <span className="text-sm">拍照或选择作业/作品图片</span>
        </button>
      )}

      {/* 预览图片 */}
      {previewUrl && state !== "idle" && (
        <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={previewUrl}
            alt="作业预览"
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 识别中动画 */}
      {state === "recognizing" && (
        <div className="bg-[#4CAF50]/5 dark:bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl p-6 text-center">
          <Loader2 size={32} className="mx-auto text-[#4CAF50] animate-spin mb-3" />
          <p className="text-sm font-medium text-[#4CAF50]">AI 正在分析...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">请稍候，正在识别作业内容</p>
        </div>
      )}

      {/* 分析结果 */}
      {state === "result" && result && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[#FF9800]" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 分析结果</h3>
          </div>

          {/* 分析内容 */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
            {result.analysis}
          </p>

          {/* 建议列表 */}
          {result.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">改进建议</h4>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF9800]/10 text-[#FF9800] text-xs font-medium shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {onSave && (
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
                  "bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 active:scale-[0.98]"
                )}
              >
                <Save size={16} />
                保存到成长档案
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                "flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium transition-all",
                "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]"
              )}
            >
              <RefreshCw size={14} />
              重新选择
            </button>
          </div>
        </div>
      )}

      {/* 预览状态：操作按钮 */}
      {state === "preview" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRecognize}
            disabled={!selectedFile}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
              "bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 active:scale-[0.98]",
              "disabled:opacity-50"
            )}
          >
            <Sparkles size={16} />
            开始识别
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium transition-all",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]"
            )}
          >
            <RefreshCw size={14} />
            重新选择
          </button>
        </div>
      )}
    </div>
  )
}
