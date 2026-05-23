import { test, expect } from '@playwright/test'

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('页面加载正常，显示登录表单', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/童行|KidStep|登录/)

    // 检查登录表单元素
    await expect(page.getByPlaceholder(/手机号/)).toBeVisible()
    await expect(page.getByRole('button', { name: /发送验证码|获取验证码/ })).toBeVisible()
  })

  test('未输入手机号时，发送验证码按钮禁用', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /发送验证码|获取验证码/ })
    await expect(sendButton).toBeDisabled()
  })

  test('输入无效手机号时，显示错误提示', async ({ page }) => {
    const phoneInput = page.getByPlaceholder(/手机号/)
    await phoneInput.fill('123')

    const sendButton = page.getByRole('button', { name: /发送验证码|获取验证码/ })
    await sendButton.click()

    // 应显示错误提示
    await expect(page.getByText(/手机号格式|请输入正确的手机号/)).toBeVisible()
  })

  test('完整登录流程', async ({ page }) => {
    // 填写手机号
    const phoneInput = page.getByPlaceholder(/手机号/)
    await phoneInput.fill('13800138000')

    // 发送验证码
    const sendButton = page.getByRole('button', { name: /发送验证码|获取验证码/ })
    await sendButton.click()

    // 等待验证码输入框出现
    const codeInput = page.getByPlaceholder(/验证码/)
    await expect(codeInput).toBeVisible({ timeout: 5_000 })

    // 填写验证码
    await codeInput.fill('123456')

    // 点击登录
    const loginButton = page.getByRole('button', { name: /登录/ })
    await loginButton.click()

    // 等待跳转到首页
    await page.waitForURL(/\/(home|dashboard)/, { timeout: 10_000 })

    // 验证已登录
    await expect(page.getByText(/首页|仪表盘|今日任务/)).toBeVisible()
  })

  test('错误验证码登录失败', async ({ page }) => {
    // 填写手机号
    const phoneInput = page.getByPlaceholder(/手机号/)
    await phoneInput.fill('13800138000')

    // 发送验证码
    const sendButton = page.getByRole('button', { name: /发送验证码|获取验证码/ })
    await sendButton.click()

    // 等待验证码输入框出现
    const codeInput = page.getByPlaceholder(/验证码/)
    await expect(codeInput).toBeVisible({ timeout: 5_000 })

    // 填写错误验证码
    await codeInput.fill('000000')

    // 点击登录
    const loginButton = page.getByRole('button', { name: /登录/ })
    await loginButton.click()

    // 应显示错误提示
    await expect(page.getByText(/验证码错误|验证码不正确/)).toBeVisible({ timeout: 5_000 })
  })
})
