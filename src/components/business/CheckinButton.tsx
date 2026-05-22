"use client"

import { useState, useCallback } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckinButtonProps {
  /** 打卡类型名称 */
  label: string
  /** 是否已打卡 */
  checked?: boolean
  /** 点击打卡回调 */
  onCheckin: () => Promise<{ points: number }>
  /** 禁用状态 */
  disabled?: boolean
}

export function CheckinButton({
  label,
  checked = false,
  onCheckin,
  disabled = false,
}: CheckinButtonProps) {
  const [isChecked, setIsChecked] = useState(checked)
  const [animating, setAnimating] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [showPoints, setShowPoints] = useState(false)

  const handleClick = useCallback(async () => {
    if (isChecked || animating || disabled) return

    setAnimating(true)
    try {
      const result = await onCheckin()
      setIsChecked(true)
      setEarnedPoints(result.points)
      setShowPoints(true)

      // 积分动画结束后隐藏
      setTimeout(() => setShowPoints(false), 1000)
    } finally {
      setAnimating(false)
    }
  }, [isChecked, animating, disabled, onCheckin])

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* 积分飘升动画 */}
      {showPoints && (
        <span className="absolute -top-8 text-sm font-bold text-[#FF9800] animate-points">
          +{earnedPoints}
        </span>
      )}

      <button
        onClick={handleClick}
        disabled={isChecked || disabled}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
          isChecked
            ? "bg-[#4CAF50]/10 text-[#4CAF50] cursor-default"
            : "bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 dark:hover:bg-[#4CAF50]/80 active:scale-95",
          animating && "animate-checkin",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Check size={16} />
        {isChecked ? "已完成" : label}
      </button>
    </div>
  )
}
