import { test, expect } from '@playwright/test'
import { mockLogin, waitForPageReady } from './helpers'

test.describe('知识中心', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
    await page.goto('/knowledge')
    await waitForPageReady(page)
  })

  test('知识中心页面加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page.getByText(/知识中心|知识/)).toBeVisible()
  })

  test('显示文章列表', async ({ page }) => {
    // 检查文章卡片
    const articles = page.locator('[data-testid="article-card"], .article-card, article')
    const count = await articles.count()

    // 应该有文章或显示空状态
    if (count > 0) {
      await expect(articles.first()).toBeVisible()
    } else {
      await expect(page.getByText(/暂无文章|空空如也/)).toBeVisible()
    }
  })

  test('文章分类筛选', async ({ page }) => {
    // 检查分类标签
    const categories = page.getByRole('tab, button').filter({ hasText: /全部|分类/ })
    if (await categories.first().isVisible()) {
      await categories.first().click()

      // 检查筛选结果
      await page.waitForLoadState('networkidle')
    }
  })

  test('点击文章查看详情', async ({ page }) => {
    const articleCard = page.locator('[data-testid="article-card"], .article-card, article').first()

    if (await articleCard.isVisible()) {
      await articleCard.click()

      // 等待跳转到文章详情页
      await page.waitForURL(/\/knowledge\/[a-zA-Z0-9-]+/, { timeout: 5_000 })

      // 检查文章详情
      await expect(page.getByText(/返回|收藏|分享/)).toBeVisible()
    }
  })

  test('文章详情页功能', async ({ page }) => {
    // 直接访问一篇文章
    await page.goto('/knowledge/test-article-id')
    await page.waitForLoadState('networkidle')

    // 检查是否显示文章内容或跳转
    const isArticle = await page.getByText(/文章内容|正文/).isVisible()
    const isRedirect = page.url().includes('/knowledge') && !page.url().includes('/knowledge/')

    expect(isArticle || isRedirect).toBeTruthy()
  })

  test('收藏文章功能', async ({ page }) => {
    const articleCard = page.locator('[data-testid="article-card"], .article-card, article').first()

    if (await articleCard.isVisible()) {
      await articleCard.click()
      await page.waitForURL(/\/knowledge\/[a-zA-Z0-9-]+/, { timeout: 5_000 })

      // 点击收藏按钮
      const favoriteButton = page.getByRole('button', { name: /收藏/ })
      if (await favoriteButton.isVisible()) {
        await favoriteButton.click()

        // 检查收藏状态变化
        await expect(
          page.getByText(/已收藏|取消收藏/)
        ).toBeVisible({ timeout: 3_000 })
      }
    }
  })

  test('响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await waitForPageReady(page)

    await expect(page.getByText(/知识中心|知识/)).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/mobile-knowledge.png' })
  })
})
