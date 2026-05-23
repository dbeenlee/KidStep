export interface ArticleSeed {
  id: string
  category: string
  title: string
  content: string
  summary: string
  tags: string // JSON string array
  sortOrder: number
}
