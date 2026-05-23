"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, MicOff } from "lucide-react"

/** 录音状态 */
type RecorderState = "idle" | "recording" | "transcribing"

interface VoiceRecorderProps {
  /** 转写完成回调 */
  onTranscribed: (text: string) => void
  /** 是否禁用 */
  disabled?: boolean
}

/** 语音录制组件 */
export function VoiceRecorder({ onTranscribed, disabled = false }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle")
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /** 清理录音计时器 */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** 停止媒体流 */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  /** 格式化录音时长 */
  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  /** 上传音频并转写 */
  const uploadAndTranscribe = useCallback(async (blob: Blob) => {
    setState("transcribing")
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", blob, "recording.webm")

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error?.message ?? "转写失败")
      }

      onTranscribed(data.data.text)
      setState("idle")
    } catch (err) {
      const message = err instanceof Error ? err.message : "转写失败，请稍后重试"
      setError(message)
      setState("idle")
    }
  }, [onTranscribed])

  /** 开始录音 */
  const startRecording = useCallback(async () => {
    setError(null)

    // 检查浏览器支持
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("浏览器不支持录音功能")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 尝试使用 webm/opus，回退到默认格式
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : ""

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)

      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        stopStream()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        if (blob.size > 0) {
          uploadAndTranscribe(blob)
        } else {
          setState("idle")
          setError("未检测到声音，请重试")
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState("recording")
      setDuration(0)

      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      stopStream()
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("请允许麦克风权限后重试")
      } else {
        setError("无法启动录音，请检查麦克风设备")
      }
    }
  }, [stopStream, uploadAndTranscribe])

  /** 停止录音 */
  const stopRecording = useCallback(() => {
    clearTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }, [clearTimer])

  /** 点击按钮切换录音 */
  function handleClick() {
    if (state === "recording") {
      stopRecording()
    } else if (state === "idle") {
      startRecording()
    }
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer()
      stopStream()
    }
  }, [clearTimer, stopStream])

  const isRecording = state === "recording"
  const isTranscribing = state === "transcribing"

  return (
    <div className="flex items-center gap-2">
      {/* 录音按钮 */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center transition-colors
          ${isRecording
            ? "bg-red-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isRecording ? "停止录音" : "开始语音输入"}
      >
        {/* 录音脉冲动画 */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}

        {isTranscribing ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <MicOff size={18} className="relative z-10" />
        ) : (
          <Mic size={18} />
        )}
      </button>

      {/* 录音时长 */}
      {isRecording && (
        <span className="text-sm text-red-500 font-mono tabular-nums">
          {formatDuration(duration)}
        </span>
      )}

      {/* 转写中提示 */}
      {isTranscribing && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          正在转写...
        </span>
      )}

      {/* 错误提示 */}
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}
