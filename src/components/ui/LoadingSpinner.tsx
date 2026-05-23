import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  /** 是否显示加载文字 */
  showText?: boolean
  text?: string
}

/** 旋转加载器 */
export function LoadingSpinner({ className, showText = false, text = "加载中..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <div
        className={cn(
          "w-8 h-8 border-2 border-[#4CAF50] border-t-transparent rounded-full animate-spin",
          className
        )}
      />
      {showText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  )
}
