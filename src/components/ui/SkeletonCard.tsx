import { Skeleton } from "./Skeleton"

interface SkeletonCardProps {
  /** 是否显示按钮占位 */
  hasButton?: boolean
  /** 是否显示头像占位 */
  hasAvatar?: boolean
}

/** 卡片骨架屏 */
export function SkeletonCard({ hasButton = false, hasAvatar = false }: SkeletonCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm space-y-3">
      {hasAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      {hasButton && <Skeleton className="h-10 w-full rounded-xl" />}
    </div>
  )
}
