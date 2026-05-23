import { create } from "zustand"

interface Child {
  id: string
  name: string
  birthday: string
  gender: string
  targetSchool: string | null
  /** 是否为共享孩子（被邀请访问） */
  isShared?: boolean
  /** 共享来源信息 */
  sharedBy?: {
    id: string
    nickname: string | null
  }
}

interface ChildStore {
  /** 当前选中的孩子 */
  currentChild: Child | null
  /** 自己的孩子列表 */
  children: Child[]
  /** 共享的孩子列表（被邀请访问） */
  sharedChildren: Child[]
  /** 设置当前孩子 */
  setCurrentChild: (child: Child) => void
  /** 设置孩子列表 */
  setChildren: (children: Child[]) => void
  /** 设置共享孩子列表 */
  setSharedChildren: (children: Child[]) => void
  /** 添加孩子 */
  addChild: (child: Child) => void
  /** 删除孩子 */
  removeChild: (childId: string) => void
  /** 获取所有孩子（自己的 + 共享的） */
  getAllChildren: () => Child[]
}

export const useChildStore = create<ChildStore>((set, get) => ({
  currentChild: null,
  children: [],
  sharedChildren: [],
  setCurrentChild: child => set({ currentChild: child }),
  setChildren: children =>
    set(state => ({
      children,
      currentChild: state.currentChild ?? children[0] ?? null,
    })),
  setSharedChildren: sharedChildren => set({ sharedChildren }),
  addChild: child =>
    set(state => ({
      children: [...state.children, child],
      currentChild: state.currentChild ?? child,
    })),
  removeChild: childId =>
    set(state => {
      const children = state.children.filter(c => c.id !== childId)
      return {
        children,
        currentChild:
          state.currentChild?.id === childId
            ? children[0] ?? null
            : state.currentChild,
      }
    }),
  getAllChildren: () => {
    const state = get()
    return [...state.children, ...state.sharedChildren]
  },
}))
