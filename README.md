# Mini Mall

微型电商演示项目 — 前台商品浏览/搜索/购物车/下单 + 后台商品/分类/订单管理。

## 技术栈

- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Prisma 5** + SQLite
- **TailwindCSS 4** (CSS-first 配置)
- **jose** + **bcryptjs** 自定义 JWT 认证
- **Zod v4** 输入校验

## 快速开始

> 完整流程见下方 [部署与运行](#部署与运行) 章节。

```bash
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

访问 http://localhost:3000

### 测试账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | admin@minimall.com | admin123 |
| 普通用户 | user@minimall.com | user123 |

## 功能概览

### 前台

- 首页商品列表（分页、搜索、分类筛选）
- 商品详情页
- 购物车（改数量、移除、结算）
- 下单（事务：价格快照 + 扣库存 + 清购物车 → 模拟支付）
- 订单列表 / 订单详情（可取消，库存自动恢复）

### 后台

- 仪表盘（商品/订单/用户/收入统计 + 最近订单）
- 商品管理（新建、编辑、上下架）
- 分类管理（新建、编辑、删除，含唯一性校验）
- 订单管理（状态筛选、发货、取消，库存自动恢复）

### 认证与权限

- JWT + httpOnly Cookie 认证
- 中间件拦截：`/cart` `/orders` 需登录，`/admin` 需 ADMIN 角色
- 已登录用户访问 `/login` `/register` 自动重定向到首页

## 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── globals.css             # TailwindCSS 4 主题变量
│   ├── (shop)/                 # 前台路由组
│   │   ├── layout.tsx          # Header + Footer
│   │   ├── page.tsx            # 首页
│   │   ├── products/           # 商品列表 + 详情
│   │   ├── cart/               # 购物车
│   │   ├── orders/             # 订单列表 + 详情
│   │   ├── login/              # 登录
│   │   └── register/           # 注册
│   ├── (admin)/                # 后台路由组
│   │   ├── layout.tsx          # 侧边栏布局
│   │   └── admin/              # 后台页面（/admin/*）
│   └── api/                    # API 路由
│       ├── auth/               # 登录/注册/登出/当前用户
│       ├── cart/               # 购物车 CRUD
│       ├── orders/             # 用户订单
│       ├── products/           # 前台商品查询
│       ├── categories/         # 前台分类查询
│       └── admin/              # 后台管理 API
├── components/
│   ├── ui/                     # Pagination 等原子组件
│   ├── shop/                   # 前台业务组件
│   ├── admin/                  # 后台业务组件
│   └── shared/                 # LogoutButton 等
├── lib/
│   ├── prisma.ts               # Prisma 单例
│   ├── auth.ts                 # JWT 认证工具
│   ├── utils.ts                # cn, formatCurrency, formatDate
│   └── queries/                # 共享查询函数
│       ├── products.ts
│       ├── cart.ts
│       ├── orders.ts
│       └── admin.ts
├── hooks/
│   └── useDebounce.ts
└── middleware.ts               # 路由保护中间件
```

## 关键设计

| 决策 | 方案 |
|---|---|
| 认证 | jose JWT + bcryptjs + httpOnly Cookie，无 next-auth 依赖 |
| 下单原子性 | `prisma.$transaction`：创建订单 → 价格快照 → 扣库存 → 清购物车 |
| 订单状态机 | PENDING → PAID → SHIPPED；PENDING/PAID → CANCELLED；终态不可变 |
| 购物车 | `upsert` 原子操作，`@@unique([userId, productId])` 防重复 |
| 价格快照 | OrderItem 冗余 productName/productPrice/subtotal |
| 软删除 | Product.isActive 控制上下架，保留历史订单关联 |
| 分页/筛选 | URL searchParams 驱动，Server Component 读取 |

## 部署与运行

### 1. 环境准备

```bash
# 需要 Node.js 18+ 和 npm
node -v

# 克隆项目
git clone https://github.com/mahuru520/Mini-Mall.git
cd Mini-Mall

# 安装依赖
npm install
```

### 2. 环境变量

项目根目录已有 `.env`（开发用，无需修改）：

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="mini-mall-dev-secret-change-in-production"
```

> 生产部署时 `AUTH_SECRET` 必须替换为随机长字符串（`openssl rand -base64 32`）

### 3. 数据库初始化

```bash
# 执行迁移建表
npx prisma migrate dev

# 生成 Prisma Client
npx prisma generate

# 导入种子数据（5分类 + 13商品 + 2用户）
npx tsx prisma/seed.ts
```

种子数据输出：

```
✅ 种子数据创建完成！
  分类: 5 个 | 商品: 13 个
  管理员: admin@minimall.com / admin123
  用户:   user@minimall.com / user123
```

### 4. 启动

```bash
# 开发模式
npm run dev          # http://localhost:3000

# 生产构建 + 启动
npx next build
npx next start       # http://localhost:3000
```

## 全链路测试

### 前台用户流程

| 步骤 | 操作 | 预期 |
|---|---|---|
| 1 | 访问 `/` | 首页显示商品网格、搜索栏、分类筛选 |
| 2 | 点击分类「数码电子」 | 仅显示该分类商品，URL 含 `?category=digital` |
| 3 | 搜索框输入「耳机」 | 实时筛选，显示匹配结果 |
| 4 | 点击商品卡片 | 进入商品详情页 `/products/[id]` |
| 5 | 点击「加入购物车」（未登录） | 自动跳转 `/login` |
| 6 | 用 `user@minimall.com / user123` 登录 | 跳回首页，Header 显示用户名 + 退出 |
| 7 | 再次点击「加入购物车」 | 显示绿色「已加入购物车」 |
| 8 | 点击 Header「购物车」 | 购物车页显示商品，可改数量/移除 |
| 9 | 点击「去结算」 | 自动下单 → 模拟支付 → 跳转订单详情页 |
| 10 | 点击 Header「我的订单」 | 订单列表页显示刚下的订单，状态「已付款」 |
| 11 | 点击订单卡片 | 进入订单详情，可点「取消订单」 |
| 12 | 点击「取消订单」并确认 | 状态变为「已取消」，库存恢复 |

### 后台管理流程

| 步骤 | 操作 | 预期 |
|---|---|---|
| 1 | 用 `admin@minimall.com / admin123` 登录 | Header 出现「后台管理」入口 |
| 2 | 点击「后台管理」 | 进入 `/admin` 仪表盘，显示统计卡片 |
| 3 | 点击「分类管理」 | 列表 5 个分类，可新建/编辑/删除 |
| 4 | 新建分类（名称 + slug） | 创建成功，列表刷新 |
| 5 | 点击「商品管理」 | 列表 13 个商品，含在售/下架状态 |
| 6 | 点击「新建商品」填写并提交 | 创建成功，回到列表 |
| 7 | 点击某商品「编辑」 | 表单预填数据，修改保存后回到列表 |
| 8 | 点击「订单管理」 | 显示所有订单，可按状态筛选 |
| 9 | 对已付款订单点击「发货」 | 状态变为「已发货」 |
| 10 | 对待付款订单点击「取消」 | 状态变为「已取消」，库存恢复 |

### 权限验证

| 测试 | 操作 | 预期 |
|---|---|---|
| 未登录访问 `/cart` | 被中间件拦截 | 重定向到 `/login?callbackUrl=/cart` |
| 未登录访问 `/orders` | 被中间件拦截 | 重定向到 `/login` |
| 普通用户访问 `/admin` | role 非 ADMIN | 重定向到 `/` |
| 已登录访问 `/login` | 已有 session | 重定向到 `/` |

## 常用命令速查

```bash
npm run dev              # 开发服务器 (localhost:3000)
npx next build           # 生产构建
npx prisma migrate dev   # 同步 schema + 生成 Client
npx prisma generate      # 仅重新生成 Client
npx tsx prisma/seed.ts   # 重新导入种子数据（会清空旧数据）
npx prisma studio        # 数据库可视化面板 (localhost:5555)
```

## 生产部署

- 替换 `.env` 中 `AUTH_SECRET` 为强随机值（`openssl rand -base64 32`）
- 如用外部数据库，同步修改 `DATABASE_URL`
- 使用 `npx prisma migrate deploy` 代替 `migrate dev`（生产专用）
- Vercel 部署：Build Command 设为 `npx prisma migrate deploy && npx next build`

## License

MIT
