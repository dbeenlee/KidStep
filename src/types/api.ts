/** 通用 API 响应 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

/** API 错误 */
export interface ApiError {
  code: string
  message: string
}

/** 分页参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 创建孩子请求 */
export interface CreateChildRequest {
  name: string
  birthday: string
  gender?: "MALE" | "FEMALE" | "UNKNOWN"
  targetSchool?: string
}

/** 提交评估请求 */
export interface SubmitAssessmentRequest {
  childId: string
  dimension: "PHYSICAL" | "LIFE" | "SOCIAL" | "LEARNING"
  answers: Array<{
    questionId: string
    optionKey: string
    score: number
  }>
}

/** 打卡请求 */
export interface CheckinRequest {
  childId: string
  type: "HABIT" | "ABILITY" | "BONDING" | "KNOWLEDGE"
  itemName: string
  note?: string
}

/** 完成任务请求 */
export interface CompleteTaskRequest {
  taskId: string
}
