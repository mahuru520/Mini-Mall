# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Mini Mall — 微型电商演示项目。前台：商品浏览/搜索/购物车/下单（模拟支付）。后台：商品/分类/订单管理 CRUD。

## 技术栈

- Next.js 16.2 (App Router) + React 19 + TypeScript 5
- Prisma 5.22 + SQLite (`prisma/dev.db`)
- TailwindCSS 4.3 (CSS-first 配置，无 `tailwind.config.ts`)
- next-auth v5 beta (Auth.js) + JWT strategy + Credentials provider
- Zod v4 做输入校验

## 常用命令

```bash
npm run dev              # 开发服务器 (localhost:3000)
npx next build           # 生产构建
npx prisma migrate dev   # 同步 schema 到数据库 + 生成 Prisma Client
npx prisma generate      # 仅重新生成 Prisma Client
npx prisma db seed       # 运行种子数据（待实现）
npx prisma studio        # 数据库可视化面板
npx tsx prisma/seed.ts   # 直接运行种子脚本
```

## 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # @import "tailwindcss" + @theme 变量
│   ├── (shop)/               # 前台路由组 (Header + Footer 布局)
│   └── (admin)/              # 后台路由组 (侧边栏布局)
├── components/
│   ├── ui/                   # 原子组件 (Button, Input, Modal...)
│   ├── shop/                 # 前台组件
│   ├── admin/                # 后台组件
│   └── shared/               # 跨场景组件
├── lib/                      # 工具库 (prisma, auth, utils, validators)
├── actions/                  # Server Actions (cart, order, admin-*)
├── hooks/                    # 客户端 hooks (useCart, useDebounce)
└── types/index.ts            # 共享类型
```

## 架构关键点

### 路由组设计
- `(shop)` 和 `(admin)` 路由组不参与 URL，纯用于区分布局文件
- 前台 `/products` → `(shop)/products/page.tsx`，使用 `(shop)/layout.tsx`
- 后台 `/admin/products` → `(admin)/products/page.tsx`，使用 `(admin)/layout.tsx`

### 认证三层防护
1. `middleware.ts` — JWT 验证，拦截 `/admin/*`（需 ADMIN 角色）和 `/cart/*`、`/orders/*`（需登录）
2. Server Component 内部二次校验 role
3. Server Action 首行 `await auth()` 校验

### 数据流原则
- Page 组件默认为 Server Component，直接调 Prisma 获取数据，通过 props 传给子组件
- 交互逻辑封装在叶子级 Client Component（`"use client"`），最小化客户端代码范围
- 所有 CRUD 操作通过 Server Actions 完成（类型安全 + revalidatePath），API Routes 仅保留 next-auth handler
- 搜索/筛选/分页用 URL searchParams 驱动，Server Component 读取

### 数据模型关键设计
- `OrderItem` 做价格快照：`productName`、`productPrice`、`subtotal` 冗余存储，防止商品价格变动影响历史订单
- `CartItem` 有 `@@unique([userId, productId])`，重复添加同一商品时增加 quantity 而非创建新行
- `Product.isActive` 做软上下架，`Product.price` 用 Float（SQLite 不支持 Decimal）
- 订单状态机：PENDING → PAID → SHIPPED，PENDING/PAID 可 → CANCELLED，SHIPPED/CANCELLED 不可变

### TailwindCSS 4 配置
- 无 `tailwind.config.ts`，通过 `src/app/globals.css` 的 `@import "tailwindcss"` 和 `@theme {}` 块配置
- PostCSS 使用 `@tailwindcss/postcss` 插件，不需要 `autoprefixer`
- 自定义颜色：`primary`, `primary-hover`, `secondary`, `danger`, `success`, `warning`, `info`
- 使用 `cn()` 工具函数合并类名（clsx + tailwind-merge）

### 路径别名
- `@/*` → `./src/*`，在 `tsconfig.json` 中配置，所有导入使用此别名

## 当前状态

项目处于阶段 1 完成状态：基础设施配置完成，Prisma Schema 已 migrate（10 张表），`next build` 通过。下一步是阶段 2（认证系统）。