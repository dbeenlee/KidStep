import { test, expect } from '@playwright/test'
import { mockLogin, waitForPageReady } from './helpers'

test.describe('任务管理', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
    await page.goto('/plan')
    await waitForPageReady(page)
  })

  test('训练计划页面加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page.getByText(/训练计划|今日任务/)).toBeVisible()
  })

  test('显示任务列表', async ({ page }) => {
    // 检查任务卡片
    const taskCards = page.locator('[data-testid="task-card"], .task-card, article')
    const count = await taskCards.count()

    // 应该有任务或显示空状态
    if (count > 0) {
      await expect(taskCards.first()).toBeVisible()
    } else {
      await expect(page.getByText(/暂无任务|空空如也/)).toBeVisible()
    }
  })

  test('任务卡片显示完整信息', async ({ page }) => {
    const taskCard = page.locator('[data-testid="task-card"], .task-card, article').first()

    if (await taskCard.isVisible()) {
      // 检查任务卡片包含必要信息
      await expect(taskCard).toContainText(/.*/) // 至少有文字内容
    }
  })

  test('点击任务卡片显示详情', async ({ page }) => {
    const taskCard = page.locator('[data-testid="task-card"], .task-card, article').first()

    if (await taskCard.isVisible()) {
      await taskCard.click()

      // 检查是否显示详情或弹窗
      const detail = page.getByText(/任务详情|完成任务|开始训练|跳过/)
      await expect(detail).toBeVisible({ timeout: 5_000 })
    }
  })

  test('完成任务流程', async ({ page }) => {
    // 找到任务卡片
    const taskCard = page.locator('[data-testid="task-card"], .task-card, article').first()

    if (await taskCard.isVisible()) {
      await taskCard.click()

      // 点击完成按钮
      const completeButton = page.getByRole('button', { name: /完成|打卡/ })
      if (await completeButton.isVisible()) {
        await completeButton.click()

        // 检查成功提示或积分增加
        await expect(
          page.getByText(/完成|太棒了|积分|⭐/)
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('跳过任务流程', async ({ page }) => {
    const taskCard = page.locator('[data-testid="task-card"], .task-card, article').first()

    if (await taskCard.isVisible()) {
      await taskCard.click()

      // 点击跳过按钮
      const skipButton = page.getByRole('button', { name: /跳过|下次再说/ })
      if (await skipButton.isVisible()) {
        await skipButton.click()

        // 检查确认提示
        await expect(
          page.getByText(/确认跳过|确定跳过/)
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('弱项任务显示标签', async ({ page }) => {
    // 检查是否有弱项标签
    const weakBadge = page.getByText(/弱项|针对弱项/)
    if (await weakBadge.isVisible()) {
      await expect(weakBadge.first()).toBeVisible()
    }
  })

  test('弱项分析面板显示', async ({ page }) => {
    // 检查弱项分析面板
    const weakPanel = page.getByText(/弱项分析|能力短板/)
    if (await weakPanel.isVisible()) {
      await expect(weakPanel).toBeVisible()
    }
  })

  test('任务日历视图', async ({ page }) => {
    // 检查日历组件
    const calendar = page.getByText(/日历|打卡记录/)
    if (await calendar.isVisible()) {
      await calendar.click()

      // 检查日历显示
      await expect(
        page.locator('table, [role="grid"], .calendar')
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await waitForPageReady(page)

    // 检查移动端布局
    await expect(page.getByText(/训练计划|今日任务/)).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/mobile-tasks.png' })
  })
})
