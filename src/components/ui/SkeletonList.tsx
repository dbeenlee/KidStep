import { SkeletonCard } from "./SkeletonCard"

interface SkeletonListProps {
  /** 骨架卡片数量 */
  count?: number
  /** 是否显示按钮占位 */
  hasButton?: boolean
  /** 是否显示头像占位 */
  hasAvatar?: boolean
}

/** 列表骨架屏 */
export function SkeletonList({ count = 3, hasButton = false, hasAvatar = false }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} hasButton={hasButton} hasAvatar={hasAvatar} />
      ))}
    </div>
  )
}
