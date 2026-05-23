import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* 每个测试最长运行时间 */
  timeout: 30_000,
  /* 测试文件并行执行 */
  fullyParallel: true,
  /* CI 环境下禁止 test.only */
  forbidOnly: !!process.env.CI,
  /* 失败重试次数 */
  retries: process.env.CI ? 2 : 0,
  /* 并行 worker 数量 */
  workers: process.env.CI ? 1 : undefined,
  /* 测试报告 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  /* 全局测试设置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://localhost:3000',
    /* 失败时截图 */
    screenshot: 'only-on-failure',
    /* 失败时录制 trace */
    trace: 'on-first-retry',
    /* 默认语言 */
    locale: 'zh-CN',
    /* 时区 */
    timezoneId: 'Asia/Shanghai',
  },
  /* 浏览器项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  /* 开发服务器配置 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
