import { test, expect } from '@playwright/test'
import { mockLogin, waitForPageReady } from './helpers'

test.describe('仪表盘/首页', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('首页加载正常，显示核心信息', async ({ page }) => {
    await waitForPageReady(page)

    // 检查页面标题
    await expect(page).toHaveTitle(/童行|KidStep/)

    // 检查底部导航栏
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('底部导航栏可正常切换页面', async ({ page }) => {
    await waitForPageReady(page)

    // 点击知识中心
    await page.getByRole('link', { name: /知识/ }).click()
    await page.waitForURL(/\/knowledge/)

    // 点击评估
    await page.getByRole('link', { name: /评估/ }).click()
    await page.waitForURL(/\/assessment/)

    // 点击训练计划
    await page.getByRole('link', { name: /计划|训练/ }).click()
    await page.waitForURL(/\/plan/)

    // 点击个人中心
    await page.getByRole('link', { name: /我的|个人/ }).click()
    await page.waitForURL(/\/profile/)

    // 返回首页
    await page.getByRole('link', { name: /首页/ }).click()
    await page.waitForURL(/\/(home|dashboard)/)
  })

  test('显示今日任务列表', async ({ page }) => {
    await waitForPageReady(page)

    // 检查任务相关元素
    const taskSection = page.getByText(/今日任务|待完成任务/)
    await expect(taskSection).toBeVisible()
  })

  test('点击任务可查看详情', async ({ page }) => {
    await waitForPageReady(page)

    // 找到第一个任务卡片
    const taskCard = page.locator('[data-testid="task-card"], .task-card, article').first()

    if (await taskCard.isVisible()) {
      await taskCard.click()

      // 应显示任务详情或跳转
      await expect(
        page.getByText(/任务详情|完成任务|开始训练/)
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('显示积分信息', async ({ page }) => {
    await waitForPageReady(page)

    // 检查积分相关元素
    const pointsElement = page.getByText(/积分|⭐/)
    await expect(pointsElement.first()).toBeVisible()
  })

  test('响应式布局 - 移动端', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    await waitForPageReady(page)

    // 检查移动端布局
    await expect(page.getByRole('navigation')).toBeVisible()

    // 截图
    await page.screenshot({ path: 'e2e/screenshots/mobile-dashboard.png' })
  })
})
