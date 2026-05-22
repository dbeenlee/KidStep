"use client"

import { useEffect, useState, useRef } from "react"
import { Award } from "lucide-react"

interface PointsBadgeProps {
  /** 积分数值 */
  points: number
}

export function PointsBadge({ points }: PointsBadgeProps) {
  const [displayPoints, setDisplayPoints] = useState(points)
  const prevPoints = useRef(points)

  /** 积分增加动画 */
  useEffect(() => {
    if (points === prevPoints.current) return

    const diff = points - prevPoints.current
    if (diff <= 0) {
      setDisplayPoints(points)
      prevPoints.current = points
      return
    }

    const steps = Math.min(diff, 20)
    const stepSize = diff / steps
    let current = prevPoints.current
    let step = 0

    const timer = setInterval(() => {
      step++
      current += stepSize
      setDisplayPoints(Math.round(current))

      if (step >= steps) {
        clearInterval(timer)
        setDisplayPoints(points)
        prevPoints.current = points
      }
    }, 50)

    return () => clearInterval(timer)
  }, [points])

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#FF9800]/10 rounded-full flex items-center justify-center">
        <Award size={22} className="text-[#FF9800]" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">总积分</p>
        <p className="text-xl font-bold text-[#FF9800]">{displayPoints}</p>
      </div>
    </div>
  )
}
