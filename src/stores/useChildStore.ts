import { create } from "zustand"

interface Child {
  id: string
  name: string
  birthday: string
  gender: string
  targetSchool: string | null
}

interface ChildStore {
  /** 当前选中的孩子 */
  currentChild: Child | null
  /** 所有孩子列表 */
  children: Child[]
  /** 设置当前孩子 */
  setCurrentChild: (child: Child) => void
  /** 设置孩子列表 */
  setChildren: (children: Child[]) => void
  /** 添加孩子 */
  addChild: (child: Child) => void
  /** 删除孩子 */
  removeChild: (childId: string) => void
}

export const useChildStore = create<ChildStore>(set => ({
  currentChild: null,
  children: [],
  setCurrentChild: child => set({ currentChild: child }),
  setChildren: children =>
    set(state => ({
      children,
      currentChild: state.currentChild ?? children[0] ?? null,
    })),
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
}))
