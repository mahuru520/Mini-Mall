# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Mini Mall — 微型电商演示项目。前台：商品浏览/搜索/购物车/下单（模拟支付）。后台：商品/分类/订单管理 CRUD。

## 技术栈

- Next.js 16.2 (App Router) + React 19 + TypeScript 5
- Prisma 5.22 + SQLite (`prisma/dev.db`)
- TailwindCSS 4.3 (CSS-first 配置，无 `tailwind.config.ts`)
- jose + bcryptjs 自定义 JWT 认证（httpOnly Cookie）
- Zod v4 做输入校验

## 常用命令

```bash
npm run dev              # 开发服务器 (localhost:3000)
npx next build           # 生产构建
npx prisma migrate dev   # 同步 schema 到数据库 + 生成 Prisma Client
npx prisma generate      # 仅重新生成 Prisma Client
npx tsx prisma/seed.ts   # 运行种子数据
npx prisma studio        # 数据库可视化面板
```

## 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # @import "tailwindcss" + @theme 变量
│   ├── (shop)/               # 前台路由组 (Header + Footer 布局)
│   │   ├── page.tsx          # 首页
│   │   ├── products/         # 商品列表 + 详情
│   │   ├── cart/             # 购物车
│   │   ├── orders/           # 订单列表 + 详情
│   │   ├── login/            # 登录
│   │   └── register/         # 注册
│   ├── (admin)/              # 后台路由组 (侧边栏布局)
│   │   ├── layout.tsx        # 侧边栏 + Header
│   │   └── admin/            # 后台页面 (URL: /admin/*)
│   │       ├── page.tsx      # 仪表盘
│   │       ├── products/     # 商品管理 (列表/新建/编辑)
│   │       ├── categories/   # 分类管理
│   │       └── orders/       # 订单管理 (列表/详情)
│   └── api/                  # API 路由
│       ├── auth/             # 登录/注册/登出/当前用户
│       ├── cart/             # 购物车 CRUD
│       ├── orders/           # 用户订单
│       ├── products/         # 前台商品查询
│       ├── categories/      # 前台分类查询
│       └── admin/            # 后台管理 API
├── components/
│   ├── ui/                   # 原子组件 (Pagination)
│   ├── shop/                 # 前台组件
│   ├── admin/                # 后台组件
│   └── shared/               # 跨场景组件 (LogoutButton)
├── lib/
│   ├── prisma.ts             # Prisma 单例
│   ├── auth.ts               # JWT 认证工具
│   ├── utils.ts              # cn, formatCurrency, formatDate
│   └── queries/              # 共享查询函数
│       ├── products.ts
│       ├── cart.ts
│       ├── orders.ts
│       └── admin.ts
├── hooks/
│   └── useDebounce.ts
└── middleware.ts              # 路由保护中间件
```

## 架构关键点

### 路由组设计
- `(shop)` 和 `(admin)` 路由组不参与 URL，纯用于区分布局文件
- 前台 `/products` → `(shop)/products/page.tsx`，使用 `(shop)/layout.tsx`
- 后台 `/admin/products` → `(admin)/admin/products/page.tsx`，使用 `(admin)/layout.tsx`
- **注意**：后台页面放在 `(admin)/admin/` 子目录下，因为两个路由组不能有相同路径的 page

### 认证三层防护
1. `middleware.ts` — JWT 验证，拦截 `/admin/*`（需 ADMIN 角色）和 `/cart/*`、`/orders/*`（需登录）
2. Server Component / layout 内二次校验 role（如 admin layout 的 `getCurrentUser()`）
3. API Route 内 `await getSession()` 校验

### 数据流原则
- Page 组件默认为 Server Component，通过 `lib/queries/` 共享查询函数获取数据，通过 props 传给子组件
- 交互逻辑封装在叶子级 Client Component（`"use client"`），最小化客户端代码范围
- 所有 CRUD 操作通过 API Routes 完成（`/api/*`），客户端 fetch 调用
- 搜索/筛选/分页用 URL searchParams 驱动，Server Component 读取

### 数据模型关键设计
- `OrderItem` 做价格快照：`productName`、`productPrice`、`subtotal` 冗余存储，防止商品价格变动影响历史订单
- `CartItem` 有 `@@unique([userId, productId])`，重复添加同一商品时增加 quantity 而非创建新行
- `Product.isActive` 做软上下架，`Product.price` 用 Float（SQLite 不支持 Decimal）
- 订单状态机：PENDING → PAID → SHIPPED，PENDING/PAID 可 → CANCELLED，SHIPPED/CANCELLED 不可变
- 下单原子性：`prisma.$transaction` 创建订单 + 价格快照 + 扣库存 + 清购物车
- 购物车原子性：`prisma.cartItem.upsert` 避免并发竞争

### TailwindCSS 4 配置
- 无 `tailwind.config.ts`，通过 `src/app/globals.css` 的 `@import "tailwindcss"` 和 `@theme {}` 块配置
- PostCSS 使用 `@tailwindcss/postcss` 插件，不需要 `autoprefixer`
- 自定义颜色：`primary`, `primary-hover`, `secondary`, `danger`, `success`, `warning`, `info`
- 使用 `cn()` 工具函数合并类名（clsx + tailwind-merge）
- **TailwindCSS 4 移除了按钮默认 `cursor: pointer`**，已在 `globals.css` `@layer base` 补回

### 路径别名
- `@/*` → `./src/*`，在 `tsconfig.json` 中配置，所有导入使用此别名

## 当前状态

项目全部阶段已完成，`npm run build` 通过：
- ✅ 阶段 1：基础设施（Prisma Schema 6 张表 + migrate）
- ✅ 阶段 2：认证系统（JWT + 中间件 + 登录/注册）
- ✅ 阶段 3：前台商品（首页/列表/详情/搜索/分类/分页）
- ✅ 阶段 4：购物车 + 下单（事务 + 价格快照 + 模拟支付 + 取消）
- ✅ 阶段 5：后台管理（仪表盘/商品CRUD/分类CRUD/订单管理）
