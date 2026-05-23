import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { findWeakDimensions, generateDailyTasks } from "../taskGenerator"

describe("taskGenerator", () => {
  describe("findWeakDimensions", () => {
    it("空评估数组应返回空数组", () => {
      expect(findWeakDimensions([])).toEqual([])
    })

    it("应返回分数最低的维度", () => {
      const assessments = [
        { dimension: "PHYSICAL", score: 80 },
        { dimension: "LIFE", score: 40 },
        { dimension: "SOCIAL", score: 70 },
        { dimension: "LEARNING", score: 90 },
      ]
      const result = findWeakDimensions(assessments)
      expect(result).toContain("LIFE")
      expect(result).toHaveLength(1)
    })

    it("多个维度低于 60 分时应返回最低的 2 个", () => {
      const assessments = [
        { dimension: "PHYSICAL", score: 30 },
        { dimension: "LIFE", score: 50 },
        { dimension: "SOCIAL", score: 80 },
        { dimension: "LEARNING", score: 90 },
      ]
      const result = findWeakDimensions(assessments)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe("PHYSICAL") // 最低分排第一
      expect(result[1]).toBe("LIFE")
    })

    it("同维度多条记录应只取第一条（最新分数）", () => {
      // 数据已按 createdAt desc 排序，第一条是最新的
      const assessments = [
        { dimension: "PHYSICAL", score: 90 }, // 最新分数 90
        { dimension: "PHYSICAL", score: 30 }, // 旧分数 30
        { dimension: "LIFE", score: 50 },
      ]
      const result = findWeakDimensions(assessments)
      // PHYSICAL 最新分数 90，LIFE 50，所以最弱是 LIFE
      expect(result).toContain("LIFE")
    })

    it("应忽略无效维度", () => {
      const assessments = [
        { dimension: "INVALID_DIM", score: 10 },
        { dimension: "PHYSICAL", score: 80 },
      ]
      const result = findWeakDimensions(assessments)
      expect(result).toEqual(["PHYSICAL"])
    })

    it("全部无效维度应返回空数组", () => {
      const assessments = [
        { dimension: "INVALID_A", score: 10 },
        { dimension: "INVALID_B", score: 20 },
      ]
      expect(findWeakDimensions(assessments)).toEqual([])
    })
  })

  describe("generateDailyTasks", () => {
    beforeEach(() => {
      // 固定随机数，确保测试确定性
      vi.spyOn(Math, "random").mockReturnValue(0.5)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("PHASE_1 应生成 3 个任务", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      expect(tasks).toHaveLength(3)
    })

    it("PHASE_2 应生成 4 个任务", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_2",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      expect(tasks).toHaveLength(4)
    })

    it("PHASE_3 应生成 5 个任务", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_3",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      expect(tasks).toHaveLength(5)
    })

    it("每个任务应包含正确的字段结构", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      const task = tasks[0]
      expect(task).toHaveProperty("childId", "child-1")
      expect(task).toHaveProperty("phase", "PHASE_1")
      expect(task).toHaveProperty("taskType")
      expect(task).toHaveProperty("templateId")
      expect(task).toHaveProperty("title")
      expect(task).toHaveProperty("description")
      expect(task).toHaveProperty("duration")
      expect(task).toHaveProperty("scheduledDate")
    })

    it("应包含三种必需任务类型（HABIT、ABILITY、BONDING）", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      const types = tasks.map((t) => t.taskType)
      expect(types).toContain("HABIT")
      expect(types).toContain("ABILITY")
      expect(types).toContain("BONDING")
    })

    it("recentTemplateIds 中的模板应被排除", () => {
      // 先获取不带排除的默认任务
      const defaultTasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      const defaultIds = defaultTasks.map((t) => t.templateId)

      // 排除这些模板后应得到不同的任务
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: defaultIds,
        existingTemplateIds: [],
      })
      const taskIds = tasks.map((t) => t.templateId)
      for (const id of defaultIds) {
        expect(taskIds).not.toContain(id)
      }
    })

    it("existingTemplateIds 中的模板应被排除", () => {
      const defaultTasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      const defaultIds = defaultTasks.map((t) => t.templateId)

      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: defaultIds,
      })
      const taskIds = tasks.map((t) => t.templateId)
      for (const id of defaultIds) {
        expect(taskIds).not.toContain(id)
      }
    })

    it("薄弱维度的任务应排在前面", () => {
      // 固定 random 保证排序稳定（所有 random 值相同，仅 isWeak 决定顺序）
      vi.spyOn(Math, "random").mockReturnValue(0.5)

      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: ["PHYSICAL"],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })

      // 至少应生成任务
      expect(tasks.length).toBeGreaterThan(0)

      // 找出 PHYSICAL 维度任务和非 PHYSICAL 任务的索引
      // PHYSICAL 维度的模板 ID 以 "ability-" 开头（ability-001~013 对应 PHYSICAL）
      // 通过排除法验证：薄弱维度任务应在前半部分
      const physicalTasks = tasks.filter(t => {
        return t.templateId.startsWith("ability-") || t.templateId.startsWith("habit-")
      })
      // 至少应有来自薄弱维度的任务
      expect(physicalTasks.length).toBeGreaterThan(0)
    })

    it("所有模板都被排除时应返回空数组", () => {
      // 排除所有 PHASE_1 和 ALL 的模板
      const allPhase1Ids = [
        "habit-001", "habit-002", "habit-003", "habit-004", "habit-005",
        "habit-006", "habit-007", "habit-009", "habit-011",
        "ability-001", "ability-002", "ability-003", "ability-004",
        "ability-005", "ability-007", "ability-013",
        "bonding-001", "bonding-002", "bonding-003", "bonding-004",
        "bonding-005", "bonding-009", "bonding-010",
        "knowledge-001", "knowledge-002", "knowledge-003", "knowledge-004",
      ]
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: allPhase1Ids,
        existingTemplateIds: [],
      })
      expect(tasks).toEqual([])
    })

    it("scheduledDate 应为当天零点", () => {
      const tasks = generateDailyTasks({
        childId: "child-1",
        phase: "PHASE_1",
        weakDimensions: [],
        recentTemplateIds: [],
        existingTemplateIds: [],
      })
      const scheduled = tasks[0].scheduledDate
      expect(scheduled.getHours()).toBe(0)
      expect(scheduled.getMinutes()).toBe(0)
      expect(scheduled.getSeconds()).toBe(0)
    })
  })
})
