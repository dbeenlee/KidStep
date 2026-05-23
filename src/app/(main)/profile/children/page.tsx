"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { useToast } from "@/hooks/useToast"
import dayjs from "dayjs"

/** 孩子表单数据 */
interface ChildFormData {
  name: string
  birthday: string
  gender: string
  targetSchool: string
}

/** 初始表单 */
const initialForm: ChildFormData = {
  name: "",
  birthday: "",
  gender: "UNKNOWN",
  targetSchool: "",
}

/** 性别选项 */
const genderOptions = [
  { value: "UNKNOWN", label: "未选择" },
  { value: "MALE", label: "男孩" },
  { value: "FEMALE", label: "女孩" },
]

export default function ChildrenPage() {
  const router = useRouter()
  const {
    currentChild,
    children,
    setChildren,
    addChild,
    removeChild,
    setCurrentChild,
  } = useChildStore()

  const { error: showError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ChildFormData>(initialForm)
  const [loading, setLoading] = useState(false)

  /** 加载孩子列表 */
  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await fetch("/api/children")
        const data = await res.json()
        if (data.success) {
          setChildren(data.data)
        }
      } catch (err) {
        console.error("加载孩子列表失败:", err)
        showError("加载数据失败，请稍后重试")
      }
    }
    loadChildren()
  }, [setChildren, showError])

  /** 重置表单 */
  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
    setShowForm(false)
  }

  /** 开始编辑 */
  function startEdit(child: {
    id: string
    name: string
    birthday: string
    gender: string
    targetSchool: string | null
  }) {
    setForm({
      name: child.name,
      birthday: dayjs(child.birthday).format("YYYY-MM-DD"),
      gender: child.gender,
      targetSchool: child.targetSchool ?? "",
    })
    setEditingId(child.id)
    setShowForm(true)
  }

  /** 提交表单（添加/编辑） */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.birthday) return

    setLoading(true)
    try {
      if (editingId) {
        // 编辑
        const res = await fetch(`/api/children/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.success) {
          // 更新本地状态
          setChildren(
            children.map(c =>
              c.id === editingId ? { ...c, ...form, targetSchool: form.targetSchool || null } : c
            )
          )
          if (currentChild?.id === editingId) {
            setCurrentChild({ ...currentChild, ...form, targetSchool: form.targetSchool || null })
          }
          resetForm()
        }
      } else {
        // 添加
        const res = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.success) {
          addChild(data.data)
          resetForm()
        }
      }
    } catch (err) {
      console.error("保存孩子信息失败:", err)
      showError("保存失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  /** 删除孩子 */
  async function handleDelete(childId: string, childName: string) {
    if (!window.confirm(`确定要删除 ${childName} 的所有数据吗？此操作不可撤销。`)) {
      return
    }

    try {
      const res = await fetch(`/api/children/${childId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        removeChild(childId)
      }
    } catch (err) {
      console.error("删除孩子失败:", err)
      showError("删除失败，请稍后重试")
    }
  }

  /** 切换当前孩子 */
  function handleSwitch(child: {
    id: string
    name: string
    birthday: string
    gender: string
    targetSchool: string | null
  }) {
    setCurrentChild(child)
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
        <h1 className="text-xl font-bold">孩子管理</h1>
      </div>

      {/* 孩子列表 */}
      <div className="space-y-3 mb-6">
        {children.map(child => (
          <div
            key={child.id}
            className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border-2 transition-colors ${
              currentChild?.id === child.id
                ? "border-[#4CAF50]"
                : "border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleSwitch(child)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4CAF50]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#4CAF50]">
                    {child.name[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">{child.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(child.birthday).format("YYYY-MM-DD")}
                      {child.gender === "MALE"
                        ? " · 男孩"
                        : child.gender === "FEMALE"
                          ? " · 女孩"
                          : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentChild?.id === child.id && (
                  <span className="text-xs px-2 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full">
                    当前
                  </span>
                )}
                <button
                  onClick={() => startEdit(child)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(child.id, child.name)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>

            {child.targetSchool && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-13">
                目标学校: {child.targetSchool}
              </p>
            )}
          </div>
        ))}

        {children.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">还没有添加孩子</p>
          </div>
        )}
      </div>

      {/* 添加按钮 */}
      {!showForm && (
        <button
          onClick={() => {
            setForm(initialForm)
            setShowForm(true)
          }}
          className="w-full h-12 bg-[#4CAF50] text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Plus size={20} />
          添加孩子
        </button>
      )}

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {editingId ? "编辑孩子" : "添加孩子"}
            </h3>
            <button
              onClick={resetForm}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 姓名 */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                姓名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="请输入孩子姓名"
                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#4CAF50] bg-transparent"
                required
              />
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                生日 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.birthday}
                onChange={e => setForm({ ...form, birthday: e.target.value })}
                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#4CAF50] bg-transparent"
                required
              />
            </div>

            {/* 性别 */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">性别</label>
              <div className="flex gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, gender: opt.value })}
                    className={`flex-1 h-9 rounded-lg text-sm transition-colors ${
                      form.gender === opt.value
                        ? "bg-[#4CAF50] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 目标学校 */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                目标学校
              </label>
              <input
                type="text"
                value={form.targetSchool}
                onChange={e =>
                  setForm({ ...form, targetSchool: e.target.value })
                }
                placeholder="选填"
                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#4CAF50] bg-transparent"
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || !form.name || !form.birthday}
              className="w-full h-11 bg-[#4CAF50] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              <Check size={18} />
              {loading ? "保存中..." : editingId ? "保存修改" : "添加孩子"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
