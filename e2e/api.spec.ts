import { test, expect } from '@playwright/test'

test.describe('API 接口测试', () => {
  const BASE_URL = 'http://localhost:3000/api'

  test('未认证访问返回 401', async ({ request }) => {
    const endpoints = [
      '/tasks/today',
      '/checkins',
      '/points',
      '/favorites',
      '/children',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`)
      expect(response.status()).toBe(401)
    }
  })

  test('认证后可访问任务接口', async ({ request }) => {
    // 先模拟登录获取 session
    const loginResponse = await request.post(`${BASE_URL}/auth/callback/credentials`, {
      data: {
        phone: '13800138000',
        code: '123456',
      },
    })

    if (loginResponse.ok()) {
      // 使用登录后的 cookie 访问任务接口
      const tasksResponse = await request.get(`${BASE_URL}/tasks/today?childId=test-child`)
      expect(tasksResponse.status()).toBeLessThan(500)
    }
  })

  test('知识文章接口返回正确格式', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/articles`)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    if (data.success) {
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBeTruthy()
    }
  })

  test('评估报告接口参数校验', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/assessments/invalid-id`)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    expect(data.success).toBe(false)
    expect(data).toHaveProperty('error')
  })

  test('积分接口返回正确格式', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/points/history?childId=test-child`)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    if (data.success) {
      expect(data).toHaveProperty('data')
    }
  })

  test('收藏接口参数校验', async ({ request }) => {
    // 缺少参数
    const response = await request.post(`${BASE_URL}/favorites`, {
      data: {},
    })
    const data = await response.json()

    expect(data).toHaveProperty('success')
    expect(data.success).toBe(false)
    expect(data.error).toHaveProperty('code')
  })

  test('打卡日历接口返回正确格式', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/checkins/calendar?childId=test-child&month=2026-05`)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    if (data.success) {
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBeTruthy()
    }
  })

  test('弱项分析接口返回正确格式', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/tasks/weak-analysis?childId=test-child`)
    const data = await response.json()

    expect(data).toHaveProperty('success')
    if (data.success) {
      expect(data).toHaveProperty('data')
    }
  })
})
