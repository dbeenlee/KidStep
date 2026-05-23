/**
 * 主功能区骨架屏 Loading
 * Next.js 会在页面数据加载时自动显示此组件
 */
export default function MainLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* 顶部导航骨架 */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="h-14 flex items-center px-4">
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* 内容区域骨架 */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 标题骨架 */}
        <div className="space-y-2">
          <div className="w-32 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* 卡片骨架 */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部导航骨架 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
