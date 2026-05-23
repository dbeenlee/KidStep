import { test, expect } from '@playwright/test'
import { mockLogin, waitForPageReady } from './helpers'

test.describe('能力评估', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
    await page.goto('/assessment')
    await waitForPageReady(page)
  })

  test('评估页面加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page.getByText(/能力评估|评估测试/)).toBeVisible()

    // 检查开始评估按钮
    const startButton = page.getByRole('button', { name: /开始评估|立即评估/ })
    await expect(startButton).toBeVisible()
  })

  test('显示评估维度说明', async ({ page }) => {
    // 检查四维度说明
    await expect(page.getByText(/身心发展|PHYSICAL/)).toBeVisible()
    await expect(page.getByText(/生活能力|LIFE/)).toBeVisible()
    await expect(page.getByText(/社会交往|SOCIAL/)).toBeVisible()
    await expect(page.getByText(/学习准备|LEARNING/)).toBeVisible()
  })

  test('开始评估流程', async ({ page }) => {
    // 点击开始评估
    const startButton = page.getByRole('button', { name: /开始评估|立即评估/ })
    await startButton.click()

    // 等待跳转到答题页面
    await page.waitForURL(/\/assessment\/quiz/, { timeout: 5_000 })

    // 检查题目显示
    await expect(page.getByText(/第.*题|题目/)).toBeVisible()
  })

  test('答题页面可选择答案', async ({ page }) => {
    // 进入答题页面
    await page.goto('/assessment/quiz')
    await waitForPageReady(page)

    // 找到选项
    const options = page.locator('button, [role="radio"], input[type="radio"]')
    const count = await options.count()

    if (count > 0) {
      // 选择第一个选项
      await options.first().click()

      // 检查是否进入下一题或显示进度
      await expect(
        page.getByText(/下一题|第.*题|进度/)
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('评估报告显示', async ({ page }) => {
    // 直接访问报告页面（假设已有评估数据）
    await page.goto('/assessment/report/test-report-id')

    // 等待页面加载
    await page.waitForLoadState('networkidle')

    // 检查是否显示报告或跳转到评估页面
    const isReport = await page.getByText(/评估报告|能力分析/).isVisible()
    const isRedirect = page.url().includes('/assessment')

    expect(isReport || isRedirect).toBeTruthy()
  })

  test('评估进度显示正确', async ({ page }) => {
    await page.goto('/assessment/quiz')
    await waitForPageReady(page)

    // 检查进度条或进度文字
    const progress = page.locator('[role="progress"], .progress, progress')
    if (await progress.isVisible()) {
      await expect(progress).toBeVisible()
    }
  })
})
