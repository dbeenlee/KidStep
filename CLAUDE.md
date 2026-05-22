# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**童行 (KidStep)** - 幼小衔接辅助工具，帮助幼儿园大班家长科学开展幼小衔接。

品牌定位：温暖、专业、轻量的教练型工具，非课程型产品。

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
npm run lint         # ESLint 检查

# 数据库 (Prisma + SQLite)
npm run db:push      # 推送 schema 到数据库
npm run db:studio    # 打开 Prisma Studio
npm run db:seed      # 填充种子数据
npm run db:migrate   # 创建迁移

# TypeScript 检查
npx tsc --noEmit     # 类型检查（不生成文件）
```

## 技术栈

- **框架**: Next.js 14 (App Router) + React 18 + TypeScript
- **样式**: Tailwind CSS 3 + shadcn/ui 模式
- **数据库**: SQLite (本地) / Supabase (生产) + Prisma ORM
- **认证**: NextAuth v5 (手机号 + 验证码)
- **状态管理**: Zustand (轻量 store)
- **图表**: Recharts (雷达图)
- **图标**: lucide-react

## 架构要点

### 路由结构

```
src/app/
├── (auth)/login/        # 登录页（无 TabBar）
├── (main)/              # 主功能区（带底部 TabBar）
│   ├── home/            # 首页仪表盘
│   ├── knowledge/       # 知识中心
│   ├── assessment/      # 能力评估
│   ├── plan/            # 训练计划
│   └── profile/         # 个人中心
└── api/                 # API 路由
```

### 核心设计原则

1. **单任务模式**: 任务队列逐个展示，完成一个才显示下一个（useTaskStore）
2. **只奖不扣**: 积分只增不减，鼓励为主
3. **四维度评估**: PHYSICAL(身心) / LIFE(生活) / SOCIAL(社会) / LEARNING(学习)
4. **三阶段训练**: PHASE_1(入学前3月) / PHASE_2(入学前1月) / PHASE_3(入学前2周)

### 状态管理 (Zustand)

- `useChildStore` - 当前孩子信息
- `useTaskStore` - 任务队列（单任务模式）
- `useQuizStore` - 答题状态机

### 认证流程

开发模式下任意6位数字验证码可通过。生产模式需配置阿里云短信服务。

API 路由通过 `auth()` 函数获取 session，middleware 仅保护页面路由。

### 品牌色

- 绿色 `#4CAF50` - 主色，代表成长
- 橙色 `#FF9800` - 辅色，代表活力
- 黄色 `#FFD700` - 点缀
- 奶油白 `#FFF8E1` - 浅色背景
- 深色模式使用 `dark:bg-gray-900` 系列

## 开发规范

### 代码风格

- 2 空格缩进
- 驼峰命名 (camelCase)
- 函数名动词开头 (getUserById, handleSubmit)
- 禁止 `any` 类型，必须定义明确类型
- 禁止 `eslint-disable` 或 `@ts-ignore`

### 响应式设计

- 手机竖屏: 默认样式，`max-w-lg` (512px)
- iPad 横屏: `md:` 前缀，`max-w-2xl` (672px)，双列网格
- 桌面端: `lg:` 前缀，侧边栏布局 (≥1024px)

### 深色模式

所有组件需支持 `dark:` 前缀的深色模式类名：
- 卡片: `bg-white dark:bg-gray-900`
- 文字: `text-gray-500 dark:text-gray-400`
- 边框: `border-gray-200 dark:border-gray-700`

### 数据库操作

使用 Prisma Client，注意：
- SQLite 不支持枚举，使用 String 字段 + 应用层校验
- JSON 字段存储为 String，读取时 parse
- 时间字段使用 DateTime

## 文档参考

详细的产品需求、技术设计、题库、任务模板等文档位于 `docs/` 目录。
