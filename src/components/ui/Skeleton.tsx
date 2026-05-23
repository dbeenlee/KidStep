import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

/** 基础骨架占位块 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  )
}
