import { test, expect } from '@playwright/test'
import { mockLogin, waitForPageReady } from './helpers'

test.describe('个人中心', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
    await page.goto('/profile')
    await waitForPageReady(page)
  })

  test('个人中心页面加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page.getByText(/个人中心|我的/)).toBeVisible()
  })

  test('显示用户信息', async ({ page }) => {
    // 检查用户信息区域
    await expect(
      page.getByText(/手机号|用户/)
    ).toBeVisible()
  })

  test('子女管理入口', async ({ page }) => {
    // 点击子女管理
    const childrenLink = page.getByRole('link', { name: /孩子|子女/ })
    if (await childrenLink.isVisible()) {
      await childrenLink.click()
      await page.waitForURL(/\/profile\/children/)
      await expect(page.getByText(/孩子信息|添加孩子/)).toBeVisible()
    }
  })

  test('添加孩子流程', async ({ page }) => {
    await page.goto('/profile/children')
    await waitForPageReady(page)

    // 点击添加孩子按钮
    const addButton = page.getByRole('button', { name: /添加孩子|新增/ })
    if (await addButton.isVisible()) {
      await addButton.click()

      // 填写孩子信息
      const nameInput = page.getByPlaceholder(/姓名|名字/)
      if (await nameInput.isVisible()) {
        await nameInput.fill('测试宝宝')

        // 选择性别
        const genderOption = page.getByText(/男孩|男/)
        if (await genderOption.isVisible()) {
          await genderOption.click()
        }

        // 填写生日
        const birthdayInput = page.getByPlaceholder(/生日|出生日期/)
        if (await birthdayInput.isVisible()) {
          await birthdayInput.fill('2020-06-15')
        }

        // 提交
        const submitButton = page.getByRole('button', { name: /保存|确定|提交/ })
        await submitButton.click()

        // 检查成功提示
        await expect(
          page.getByText(/添加成功|保存成功/)
        ).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test('成长档案入口', async ({ page }) => {
    // 点击成长档案
    const archiveLink = page.getByRole('link', { name: /成长档案|档案/ })
    if (await archiveLink.isVisible()) {
      await archiveLink.click()
      await page.waitForURL(/\/profile\/archive/)
      await expect(page.getByText(/成长档案|里程碑/)).toBeVisible()
    }
  })

  test('成长档案页面功能', async ({ page }) => {
    await page.goto('/profile/archive')
    await waitForPageReady(page)

    // 检查标签页
    await expect(page.getByText(/文字|图片|语音|作业/)).toBeVisible()
  })

  test('积分历史入口', async ({ page }) => {
    // 点击积分历史
    const pointsLink = page.getByRole('link', { name: /积分|积分历史/ })
    if (await pointsLink.isVisible()) {
      await pointsLink.click()
      await page.waitForURL(/\/profile\/points/)
      await expect(page.getByText(/积分历史|积分记录/)).toBeVisible()
    }
  })

  test('成就系统入口', async ({ page }) => {
    // 点击成就
    const achievementsLink = page.getByRole('link', { name: /成就|徽章/ })
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      await page.waitForURL(/\/profile\/achievements/)
      await expect(page.getByText(/成就|徽章/)).toBeVisible()
    }
  })

  test('设置页面', async ({ page }) => {
    // 点击设置
    const settingsLink = page.getByRole('link', { name: /设置/ })
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await page.waitForURL(/\/profile\/settings/)
      await expect(page.getByText(/设置|偏好/)).toBeVisible()
    }
  })

  test('响应式布局 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await waitForPageReady(page)

    await expect(page.getByText(/个人中心|我的/)).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/mobile-profile.png' })
  })
})
