<div align="center">

<img src="public/images/brand/app-icon.png" alt="KidStep Logo" width="120" />

# KidStep

**每一步，都陪你走**

幼小衔接辅助工具，帮助幼儿园大班家长科学开展幼小衔接。

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright)](https://playwright.dev/)

</div>

---

## 项目简介

KidStep 是一款轻量级教练型工具，面向幼儿园大班家长。与课程型产品不同，KidStep 专注于**日常习惯、能力评估和家长指导**，让幼小衔接科学、轻松、无压力。

### 核心功能

- **能力评估** — 4 维度（身心/生活/社会/学习）× 10 题 = 40 题雷达图评估
- **训练计划** — 3 阶段个性化任务系统，单任务模式减少认知负荷
- **打卡系统** — 每日习惯追踪，连续打卡积分奖励
- **知识中心** — 33 篇精选幼小衔接文章，支持收藏和搜索
- **成长档案** — 里程碑记录、进度可视化、成就徽章
- **弱项推荐** — 智能识别能力短板，优先分配针对性任务
- **AI 作业识别** — 拍照识别作业完成情况，AI 分析反馈
- **语音录入** — 语音转文字记录成长日记

### 设计原则

| 原则 | 说明 |
|------|------|
| 单任务模式 | 一次只展示一个任务，减少认知负荷 |
| 只奖不扣 | 积分只增不减，鼓励为主 |
| 家长主导 | 家长根据孩子情况自定义计划 |
| 科学依据 | 基于教育研究和新课标要求 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS 3, shadcn/ui 模式 |
| 数据库 | SQLite (开发) / Supabase (生产) |
| ORM | Prisma |
| 认证 | NextAuth v5 (手机号 + 短信) |
| 状态管理 | Zustand |
| 图表 | Recharts |
| 图标 | lucide-react |
| AI 服务 | OpenAI / DeepSeek / MiMo / 阿里云 / 腾讯云 / 百度云 |
| 单元测试 | Vitest + Testing Library |
| E2E 测试 | Playwright |
| 代码规范 | ESLint + next/core-web-vitals |

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/kidstep.git
cd kidstep

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
npm run db:push

# 填充种子数据（可选）
npm run db:seed

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 开发模式登录

开发模式下任意 6 位数字验证码即可登录：
1. 输入任意 11 位手机号
2. 输入任意 6 位验证码（如 `123456`）
3. 点击登录

---

## 项目结构

```
kidstep/
├── prisma/
│   ├── schema.prisma          # 数据库 Schema
│   └── seed.ts                # 种子数据
├── src/
│   ├── app/
│   │   ├── (auth)/            # 登录页
│   │   ├── (main)/            # 主功能区（带底部导航）
│   │   │   ├── home/          # 首页仪表盘
│   │   │   ├── knowledge/     # 知识中心
│   │   │   ├── assessment/    # 能力评估
│   │   │   ├── plan/          # 训练计划
│   │   │   └── profile/       # 个人中心
│   │   └── api/               # API 路由
│   │       ├── ai/            # AI 服务（图像识别/语音转写）
│   │       ├── auth/          # 认证相关
│   │       ├── tasks/         # 任务管理
│   │       └── ...
│   ├── components/
│   │   ├── ui/                # 基础 UI 组件
│   │   ├── business/          # 业务组件
│   │   └── layout/            # 布局组件
│   ├── lib/                   # 工具函数
│   │   ├── ai.ts              # AI 服务封装
│   │   ├── auth.ts            # 认证工具
│   │   ├── db.ts              # 数据库客户端
│   │   └── ...
│   ├── stores/                # Zustand 状态管理
│   ├── hooks/                 # 自定义 Hooks
│   ├── types/                 # TypeScript 类型定义
│   └── constants/             # 常量（题库、任务模板、文章）
├── e2e/                       # Playwright E2E 测试
│   ├── helpers.ts             # 测试辅助函数
│   ├── login.spec.ts          # 登录流程测试
│   ├── dashboard.spec.ts      # 仪表盘测试
│   ├── assessment.spec.ts     # 评估流程测试
│   ├── tasks.spec.ts          # 任务管理测试
│   ├── profile.spec.ts        # 个人中心测试
│   ├── knowledge.spec.ts      # 知识中心测试
│   ├── api.spec.ts            # API 接口测试
│   └── performance.spec.ts    # 性能测试
├── public/
│   ├── images/brand/          # 品牌素材
│   ├── icons/                 # PWA 图标
│   ├── manifest.json          # PWA 配置
│   └── sw.js                  # Service Worker
└── docs/                      # 产品文档
```

---

## 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 生产构建
npm run start            # 启动生产服务器
npm run lint             # ESLint 检查

# 数据库
npm run db:push          # 推送 Schema 到数据库
npm run db:studio        # 打开 Prisma Studio
npm run db:seed          # 填充种子数据
npm run db:migrate       # 创建迁移

# 测试
npm run test             # 运行单元测试（269 个）
npm run test:watch       # 监听模式
npm run test:coverage    # 覆盖率报告

# E2E 测试
npm run test:e2e         # 运行 E2E 测试
npm run test:e2e:ui      # Playwright UI 模式
npm run test:e2e:debug   # 调试模式
npm run test:e2e:report  # 查看测试报告
```

---

## 功能详情

### 能力评估系统

- 4 维度：身心发展 (PHYSICAL) / 生活能力 (LIFE) / 社会交往 (SOCIAL) / 学习准备 (LEARNING)
- 每维度 10 题，共 40 题
- 雷达图可视化
- 基于分数的个性化建议

### 训练计划

- **PHASE_1** — 入学前 3 月：基础习惯养成
- **PHASE_2** — 入学前 1 月：能力强化提升
- **PHASE_3** — 入学前 2 周：适应性训练
- 单任务模式：一次只展示一个任务
- 积分和连续打卡奖励

### 弱项智能推荐

- 自动识别评估中的弱项维度
- 优先分配针对弱项的训练任务
- 弱项任务卡片显示橙色角标
- 弱项分析面板展示完成进度

### AI 图像识别

- 支持拍照识别作业/作品
- 多供应商支持：OpenAI / DeepSeek / MiMo / 阿里云 / 腾讯云 / 百度云
- 根据 `AI_BASE_URL` 自动检测供应商
- 识别结果可保存为里程碑

### 语音录入

- 浏览器 MediaRecorder API 录音
- 语音转文字记录成长日记
- 支持 webm/opus 格式
- 录音完成后自动填充文字

---

## 环境变量

```bash
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# 短信服务（生产环境）
SMS_ACCESS_KEY_ID=""
SMS_ACCESS_KEY_SECRET=""
SMS_SIGN_NAME=""
SMS_TEMPLATE_CODE=""

# AI 服务（可选）
AI_API_KEY=""
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"
AI_API_SECRET=""  # 百度云需要

# AI 供应商示例：
# DeepSeek:  AI_BASE_URL=https://api.deepseek.com/v1  AI_MODEL=deepseek-chat
# MiMo:     AI_BASE_URL=https://api.mimo.com/v1       AI_MODEL=mimo-v2
# MiniMax:  AI_BASE_URL=https://api.minimax.chat/v1   AI_MODEL=abab6.5-chat
# Kimi:     AI_BASE_URL=https://api.moonshot.cn/v1    AI_MODEL=moonshot-v1-8k-vision
# 阿里云:    AI_BASE_URL=https://dashscope.aliyuncs.com  AI_MODEL=qwen-vl-plus
# 腾讯云:    AI_BASE_URL=https://hunyuan.tencentcloud.com  AI_MODEL=hunyuan-vision
# 百度云:    AI_BASE_URL=https://aip.baidubce.com      AI_MODEL=ernie-4.0
```

---

## 测试

### 单元测试

使用 Vitest + Testing Library，覆盖核心业务逻辑：

```bash
npm run test
# Test Files  29 passed (29)
# Tests  269 passed (269)
```

### E2E 测试

使用 Playwright，覆盖核心用户流程：

```bash
npm run test:e2e
```

测试覆盖：
- 登录流程
- 仪表盘/首页
- 能力评估
- 任务管理
- 个人中心
- 知识中心
- API 接口
- 性能指标

---

## 版本路线

### v1.0 - MVP ✅

- [x] 项目脚手架（Next.js 14 + Prisma + Tailwind）
- [x] 数据库 Schema 设计
- [x] 手机号 + 短信认证
- [x] 孩子档案管理
- [x] 能力评估（4 维度、40 题、雷达图）
- [x] 每日打卡系统 + 日历
- [x] 知识中心（文章列表、详情、收藏）
- [x] 成长档案 + 里程碑
- [x] 响应式布局（手机/平板/桌面）
- [x] 深色模式支持

### v1.1 - 增强版 ✅

- [x] 积分系统（只奖不扣）
- [x] 单任务模式（一次一个任务）
- [x] 训练计划（3 阶段个性化任务）
- [x] 仪表盘 + 周报/月报
- [x] 完整知识库（33 篇文章 + 搜索）
- [x] 微信分享成长报告（待实现）
- [x] 照片上传里程碑

### v1.2 - 成长版 ✅

- [x] 弱项智能推荐
- [x] AI 图像识别（作业识别）
- [x] 语音输入（语音日记）
- [x] 多供应商 AI 支持
- [x] 家庭成员邀请（邀请码 + 共享查看）
- [x] 自动生成成长海报（Canvas 绘制 + 分享）
- [x] 成就系统（徽章、解锁）

### 技术债

- [x] ESLint 配置 + 修复
- [x] 单元测试框架（Vitest）
- [x] E2E 测试框架（Playwright）
- [x] SEO 结构化数据（JSON-LD）
- [x] 安全 Headers（HSTS/CSP/X-Frame-Options）
- [x] 性能优化（optimizePackageImports/Cache-Control/Bundle Analyzer）
- [x] Core Web Vitals 监控（@vercel/speed-insights）
- [x] 数据埋点系统（sendBeacon + /api/analytics）

---

## 品牌

| 项目 | 值 |
|------|-----|
| 中文名 | 童行 |
| 英文名 | KidStep |
| Slogan | 每一步，都陪你走 |
| 主色 | #4CAF50 (绿色 - 成长) |
| 辅色 | #FF9800 (橙色 - 活力) |
| 点缀 | #FFD700 (黄色) |
| 浅色背景 | #FFF8E1 (奶油白) |

---

## 文档

- [产品需求文档](docs/PRD-产品需求文档.md)
- [程序设计文档](docs/程序设计文档.md)
- [组件接口设计](docs/组件接口设计.md)
- [评估题库](docs/评估题库.md)
- [任务模板库](docs/任务模板库.md)
- [知识文章大纲](docs/知识文章大纲.md)
- [幼小衔接学习指导](docs/资料/新课标背景下的幼小衔接学习指导.md)

---

## 许可证

[Apache License 2.0](./LICENSE)
