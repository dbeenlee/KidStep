"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, FileText, X, Camera, Image as ImageIcon } from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { useToast } from "@/hooks/useToast"
import { TimelineItem } from "@/components/business/TimelineItem"
import GrowthPoster from "@/components/business/GrowthPoster"
import { HomeworkRecognizer } from "@/components/business/HomeworkRecognizer"
import { VoiceRecorder } from "@/components/ui/VoiceRecorder"
import dayjs from "dayjs"

/** 里程碑数据类型 */
interface Milestone {
  id: string
  childId: string
  type: string
  content: string | null
  mediaUrls: string | null
  createdAt: string
}

/** 按月分组的时间轴数据 */
interface MonthGroup {
  label: string
  items: Milestone[]
}

/** 里程碑类型选项 */
const milestoneTypes = [
  { value: "TEXT", label: "文字记录" },
  { value: "PHOTO", label: "照片" },
  { value: "ASSESSMENT", label: "评估记录" },
  { value: "HOMEWORK", label: "作业识别" },
]

export default function ArchivePage() {
  const router = useRouter()
  const { currentChild } = useChildStore()
  const { error: showError } = useToast()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState("TEXT")
  const [formContent, setFormContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingPoster, setGeneratingPoster] = useState(false)
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null)
  const [posterChild, setPosterChild] = useState<{ name: string; birthday: string; targetSchool?: string | null } | null>(null)
  const [posterScores, setPosterScores] = useState<Record<string, number>>({})
  const [posterPoints, setPosterPoints] = useState(0)
  const [posterMilestones, setPosterMilestones] = useState<Array<{ content: string | null; createdAt: string }>>([])

  // 照片相关状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 加载里程碑数据 */
  const loadMilestones = useCallback(async () => {
    if (!currentChild) return
    try {
      const res = await fetch(`/api/milestones?childId=${currentChild.id}`)
      const data = await res.json()
      if (data.success) {
        setMilestones(data.data)
      }
    } catch (err) {
      console.error("加载里程碑失败:", err)
      showError("加载数据失败，请稍后重试")
    }
  }, [currentChild, showError])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  /** 按月分组 */
  useEffect(() => {
    const groups: Record<string, Milestone[]> = {}
    milestones.forEach(m => {
      const key = dayjs(m.createdAt).format("YYYY年MM月")
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    setMonthGroups(
      Object.entries(groups).map(([label, items]) => ({ label, items }))
    )
  }, [milestones])

  /** 选择文件 */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    setSelectedFiles(fileArray)

    // 生成预览 URL
    const urls = fileArray.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
  }

  /** 移除已选文件 */
  function removeFile(index: number) {
    // 释放预览 URL
    URL.revokeObjectURL(previewUrls[index])

    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviewUrls(newUrls)

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /** 上传单个文件 */
  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error?.message ?? "上传失败")
    }

    return data.data.url
  }

  /** 提交表单 */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!currentChild) return

    // 照片类型必须选择文件
    if (formType === "PHOTO" && selectedFiles.length === 0) {
      return
    }

    // 文字类型必须有内容
    if (formType !== "PHOTO" && !formContent.trim()) {
      return
    }

    setLoading(true)

    try {
      let mediaUrls: string[] | null = null

      // 如果是照片类型，先上传文件
      if (formType === "PHOTO" && selectedFiles.length > 0) {
        setUploading(true)
        mediaUrls = []

        for (let i = 0; i < selectedFiles.length; i++) {
          const url = await uploadFile(selectedFiles[i])
          mediaUrls.push(url)
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
        }

        setUploading(false)
      }

      // 创建里程碑
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: currentChild.id,
          type: formType,
          content: formType === "PHOTO" ? (formContent.trim() || null) : formContent.trim(),
          mediaUrls,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMilestones(prev => [data.data, ...prev])
        resetForm()
      }
    } catch (err) {
      console.error("保存里程碑失败:", err)
      showError("保存失败，请稍后重试")
    } finally {
      setLoading(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  /** 重置表单 */
  function resetForm() {
    setFormContent("")
    setSelectedFiles([])
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /** 作业识别保存回调：上传图片 + 创建里程碑 */
  const handleHomeworkSave = useCallback(async (analysis: string, _imageUrl: string, file: File) => {
    if (!currentChild) return

    setLoading(true)
    try {
      // 上传图片到服务器
      const uploadForm = new FormData()
      uploadForm.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        showError(uploadData.error?.message ?? "图片上传失败")
        return
      }

      // 创建里程碑
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: currentChild.id,
          type: "PHOTO",
          content: analysis,
          mediaUrls: [uploadData.data.url],
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMilestones(prev => [data.data, ...prev])
        setShowForm(false)
        setFormContent("")
      }
    } catch (err) {
      console.error("保存作业识别结果失败:", err)
      showError("保存失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [currentChild, showError])

  /** 删除里程碑 */
  async function handleDelete(id: string) {
    if (!window.confirm("确定要删除这条记录吗？")) return

    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setMilestones(prev => prev.filter(m => m.id !== id))
      }
    } catch (err) {
      console.error("删除里程碑失败:", err)
      showError("删除失败，请稍后重试")
    }
  }

  /** 生成入学准备报告 PDF */
  async function handleGenerateReport() {
    if (!currentChild || generating) return

    setGenerating(true)
    try {
      // 1. 获取报告数据
      const res = await fetch(`/api/report?childId=${currentChild.id}`)
      const result = await res.json()
      if (!result.success) {
        showError(result.error?.message ?? "获取报告数据失败")
        return
      }

      // 2. 动态导入 PDF 组件（避免 SSR 问题）
      const { pdf } = await import("@react-pdf/renderer")
      const { GrowthReport } = await import("@/components/business/GrowthReport")

      // 3. 生成 PDF blob
      const blob = await pdf(
        <GrowthReport data={result.data} />
      ).toBlob()

      // 4. 创建下载链接并触发下载
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const dateStr = dayjs().format("YYYYMMDD")
      link.href = url
      link.download = `${currentChild.name}_入学准备报告_${dateStr}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("生成报告失败:", err)
      showError("生成报告失败，请稍后重试")
    } finally {
      setGenerating(false)
    }
  }

  /** 生成成长海报 */
  async function handleGeneratePoster() {
    if (!currentChild || generatingPoster) return

    setGeneratingPoster(true)
    setPosterDataUrl(null)

    try {
      // 获取报告数据（包含评估分数、里程碑、积分）
      const res = await fetch(`/api/report?childId=${currentChild.id}`)
      const result = await res.json()
      if (!result.success) {
        showError(result.error?.message ?? "获取数据失败")
        return
      }

      const { child: childInfo, assessments, milestones: ms, totalPoints } = result.data

      // 构建维度分数映射
      const scores: Record<string, number> = {}
      for (const a of assessments) {
        scores[a.dimension] = a.score
      }

      // 设置海报数据，GrowthPoster 组件渲染完成后会自动调用 onGenerated
      setPosterChild(childInfo)
      setPosterScores(scores)
      setPosterPoints(totalPoints)
      setPosterMilestones(ms.slice(0, 3))
    } catch (err) {
      console.error("生成海报失败:", err)
      showError("生成海报失败，请稍后重试")
    } finally {
      setGeneratingPoster(false)
    }
  }

  /** 海报生成完成回调 */
  const handlePosterGenerated = useCallback((dataUrl: string) => {
    setPosterDataUrl(dataUrl)
    // 清空触发数据，避免重复渲染
    setPosterChild(null)
  }, [])

  /** 下载海报图片 */
  function handleDownloadPoster() {
    if (!posterDataUrl || !currentChild) return
    const link = document.createElement("a")
    const dateStr = dayjs().format("YYYYMMDD")
    link.href = posterDataUrl
    link.download = `${currentChild.name}_成长海报_${dateStr}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /** 关闭海报预览 */
  function handleClosePoster() {
    setPosterDataUrl(null)
  }

  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">成长档案</h1>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">请先选择一个孩子</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">成长档案</h1>
      </div>

      {/* 添加按钮 */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-11 bg-[#4CAF50] text-white rounded-xl font-medium flex items-center justify-center gap-2 mb-6 active:scale-[0.98] transition-transform"
        >
          <Plus size={18} />
          记录里程碑
        </button>
      )}

      {/* 添加表单 */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">记录里程碑</h3>
            <button
              onClick={resetForm}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            {/* 类型选择 */}
            <div className="flex gap-2">
              {milestoneTypes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormType(t.value)}
                  className={`flex-1 h-9 rounded-lg text-xs transition-colors ${
                    formType === t.value
                      ? "bg-[#4CAF50] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 作业识别（仅 HOMEWORK 类型显示） */}
            {formType === "HOMEWORK" && (
              <HomeworkRecognizer
                childId={currentChild.id}
                onSave={handleHomeworkSave}
              />
            )}

            {/* 以下为非 HOMEWORK 类型的表单内容 */}
            {formType !== "HOMEWORK" && (
              <>
                {/* 照片选择器（仅 PHOTO 类型显示） */}
                {formType === "PHOTO" && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#4CAF50] hover:text-[#4CAF50] transition-colors"
                    >
                      <Camera size={24} />
                      <span className="text-xs">点击选择照片（可多选）</span>
                    </button>

                    {/* 预览已选图片 */}
                    {previewUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {previewUrls.map((url, i) => (
                          <div key={i} className="relative w-16 h-16">
                            <img
                              src={url}
                              alt={`预览 ${i + 1}`}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 上传进度 */}
                    {uploading && (
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          上传中 {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 文字内容 */}
                <div className="relative">
                  <textarea
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder={formType === "PHOTO" ? "添加描述（可选）..." : "记录这个重要时刻..."}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:border-[#4CAF50] bg-transparent"
                    required={formType !== "PHOTO"}
                  />
                  {/* 语音输入（仅文字记录模式） */}
                  {formType === "TEXT" && (
                    <div className="absolute bottom-2 right-2">
                      <VoiceRecorder
                        onTranscribed={text => {
                          setFormContent(prev => prev ? `${prev}\n${text}` : text)
                        }}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (formType !== "PHOTO" && !formContent.trim()) || (formType === "PHOTO" && selectedFiles.length === 0)}
                  className="w-full h-10 bg-[#4CAF50] text-white rounded-xl font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {loading ? "保存中..." : "保存"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* 时间轴 */}
      {monthGroups.length > 0 ? (
        <div className="space-y-6">
          {monthGroups.map(group => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {group.label}
              </h3>
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                {group.items.map(item => (
                  <TimelineItem
                    key={item.id}
                    milestone={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">还没有成长记录</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            点击上方按钮记录第一个里程碑
          </p>
        </div>
      )}

      {/* 生成报告 & 海报入口 */}
      {milestones.length > 0 && (
        <div className="mt-8 space-y-3">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full h-12 bg-[#FF9800] text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <FileText size={18} />
            {generating ? "正在生成报告..." : "生成入学准备报告"}
          </button>
          <button
            onClick={handleGeneratePoster}
            disabled={generatingPoster}
            className="w-full h-12 bg-[#4CAF50] text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <ImageIcon size={18} />
            {generatingPoster ? "正在生成海报..." : "生成成长海报"}
          </button>
        </div>
      )}

      {/* 隐藏的 GrowthPoster 组件，用于生成海报图片 */}
      {posterChild && (
        <GrowthPoster
          child={posterChild}
          scores={posterScores}
          totalPoints={posterPoints}
          milestones={posterMilestones}
          onGenerated={handlePosterGenerated}
        />
      )}

      {/* 海报预览模态框 */}
      {posterDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={handleClosePoster}
        >
          <div
            className="relative max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* 海报图片 */}
            <img
              src={posterDataUrl}
              alt="成长海报"
              width={375}
              height={667}
              className="w-full rounded-2xl shadow-2xl"
            />

            {/* 底部按钮 */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDownloadPoster}
                className="flex-1 h-12 bg-[#4CAF50] text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
              >
                保存图片
              </button>
              <button
                onClick={handleClosePoster}
                className="flex-1 h-12 bg-white/20 text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
