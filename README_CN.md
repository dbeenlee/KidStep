<div align="center">

<img src="public/images/brand/app-icon.png" alt="童行 Logo" width="120" />

# 童行 (KidStep)

**每一步，都陪你走**

帮助家长辅导孩子从幼儿园顺利过渡到小学的轻量级教练工具。

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

[English](./README.md)

</div>

---

## 项目概述

童行是一款面向幼升小家长的轻量级教练工具。与课程类产品不同，童行聚焦于**日常习惯、能力评估和家长引导**，让幼小衔接过程轻松无压力。

### 核心功能

- **能力评估** - 4 个维度（体能、生活、社交、学习），40 道题目
- **训练计划** - 3 阶段个性化任务系统，单任务模式
- **打卡系统** - 每日习惯追踪，连续打卡奖励
- **知识中心** - 幼小衔接主题精选文章
- **成长档案** - 里程碑记录与进度可视化

### 设计原则

| 原则 | 说明 |
|------|------|
| 单任务模式 | 一次只展示一个任务，降低认知负担 |
| 只奖不扣 | 永不扣分，始终鼓励 |
| 家长主导 | 家长根据孩子需求定制计划 |
| 科学依据 | 基于教育研究和新课程标准 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | React 18、Tailwind CSS 3、shadcn/ui 模式 |
| 数据库 | SQLite (开发) / Supabase (生产) |
| ORM | Prisma |
| 认证 | NextAuth v5 (手机号 + 短信验证码) |
| 状态管理 | Zustand |
| 图表 | Recharts |
| 图标 | lucide-react |

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

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

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 开发模式登录

开发模式下，任意 6 位数字验证码均可通过短信验证：
1. 输入任意 11 位手机号
2. 输入任意 6 位验证码（如 `123456`）
3. 点击登录

---

## 项目结构

```
kidstep/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── src/
│   ├── app/
│   │   ├── (auth)/            # 认证页面（登录）
│   │   ├── (main)/            # 主功能页面（带底部导航）
│   │   │   ├── home/          # 首页仪表盘
│   │   │   ├── knowledge/     # 知识中心
│   │   │   ├── assessment/    # 能力评估
│   │   │   ├── plan/          # 训练计划
│   │   │   └── profile/       # 个人中心
│   │   └── api/               # API 路由
│   ├── components/
│   │   └── business/          # 业务组件
│   ├── lib/                   # 工具库
│   ├── stores/                # Zustand 状态管理
│   ├── hooks/                 # 自定义 Hooks
│   ├── contexts/              # React Context
│   ├── types/                 # TypeScript 类型
│   └── constants/             # 常量（题库、任务模板等）
├── public/
│   └── images/brand/          # 品牌素材
└── docs/                      # 项目文档
```

---

## 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产环境构建
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint

npm run db:push      # 推送 Schema 到数据库
npm run db:studio    # 打开 Prisma Studio
npm run db:seed      # 填充数据库
npm run db:migrate   # 创建迁移
```

---

## 功能详情

### 评估系统
- 4 个维度 × 10 道题 = 共 40 道
- 雷达图可视化
- 基于分数的个性化建议

### 训练计划
- 3 个阶段，与入学时间线对齐
- 单任务模式，专注学习
- 积分和连续打卡奖励

### 知识中心
- 分类文章浏览
- 搜索功能
- 收藏系统

---

## 开发路线

### v1.0 - MVP（进行中）

- [x] 项目脚手架（Next.js 14 + Prisma + Tailwind）
- [x] 数据库模型设计
- [x] 手机号 + 短信验证码登录
- [x] 孩子信息管理
- [x] 能力评估（4 维度 40 题，雷达图报告）
- [x] 每日打卡系统 + 日历视图
- [x] 知识中心（文章列表、详情、收藏）
- [x] 成长档案与里程碑
- [x] 响应式布局（手机 / 平板 / 桌面）
- [x] 深色模式支持

### v1.1 - 增强版（计划中）

- [ ] 积分系统（只奖不扣）
- [ ] 单任务模式（一次只展示一个任务）
- [ ] 训练计划（三阶段个性化任务）
- [ ] 数据驾驶舱（周报/月报、趋势图）
- [ ] 完整知识库（33 篇文章 + 搜索）
- [ ] 成长报告分享到微信
- [ ] 里程碑照片上传

### v1.2 - 增长版（计划中）

- [ ] 家庭成员邀请
- [ ] 自动生成成长海报
- [ ] 成就系统（徽章墙、成就解锁）
- [ ] 薄弱项智能复习任务
- [ ] 图片识别（AI 接入）
- [ ] 语音输入记录

### 技术债务（持续迭代）

- [ ] 单元测试 + E2E 测试
- [ ] Lighthouse 性能 > 90
- [ ] SEO 优化（sitemap、OG 标签、结构化数据）
- [ ] 数据埋点与漏斗分析

---

## 品牌信息

| 项目 | 值 |
|------|------|
| 中文名 | 童行 |
| 英文名 | KidStep |
| 品牌口号 | 每一步，都陪你走 (Every step, with you) |
| 主色 | #4CAF50（绿色）|
| 辅助色 | #FF9800（橙色）|

---

## 项目文档

- [产品需求文档](docs/PRD-产品需求文档.md)
- [技术设计文档](docs/程序设计文档.md)
- [组件接口设计](docs/组件接口设计.md)
- [评估题库](docs/评估题库.md)
- [任务模板库](docs/任务模板库.md)
- [知识文章大纲](docs/知识文章大纲.md)

---

## 许可证

[Apache License 2.0](./LICENSE)
