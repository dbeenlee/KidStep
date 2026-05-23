import { ClipboardCheck, BookOpen, Activity } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 欢迎语 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">👋 你好</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">今天也要加油哦</p>
        </div>
        <Image
          src="/images/brand/app-icon.png"
          alt="童行"
          width={40}
          height={40}
          className="rounded-lg"
        />
      </div>

      {/* 快速打卡 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">⚡ 快速打卡</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { icon: Activity, label: "运动打卡", color: "#4CAF50" },
            { icon: BookOpen, label: "阅读打卡", color: "#FF9800" },
            { icon: ClipboardCheck, label: "习惯打卡", color: "#2196F3" },
          ].map(item => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm active:scale-95 transition-transform touch-target"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: item.color + "20" }}
              >
                <item.icon size={24} style={{ color: item.color }} />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* iPad横屏：两列布局 */}
      <div className="md:grid md:grid-cols-2 md:gap-6">
        {/* 今日任务 */}
        <section className="mb-6 md:mb-0">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">📋 今日任务</h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              完成首次评估后，将为你生成个性化任务
            </p>
          </div>
        </section>

        {/* 能力评估入口 */}
        <section className="mb-6 md:mb-0">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">📊 能力评估</h2>
          <a
            href="/assessment"
            className="block bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">开始首次评估</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">4个维度，40道题，约10分钟</p>
              </div>
              <div className="text-[#4CAF50] text-2xl">→</div>
            </div>
          </a>
        </section>
      </div>

      {/* 知识速递 */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">💡 知识速递</h2>
        <a
          href="/knowledge"
          className="block bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="font-medium text-sm">幼小衔接到底是什么？</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            &ldquo;零起点&rdquo;不等于&ldquo;零准备&rdquo;，了解核心理念，建立正确认知...
          </p>
        </a>
      </section>
    </div>
  )
}
