import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const productUpdateSchema = z.object({
  name: z.string().min(1, "请输入商品名称").max(200).optional(),
  description: z.string().min(1, "请输入商品描述").optional(),
  price: z.number().min(0.01, "价格必须大于0").optional(),
  imageUrl: z.string().min(1, "请输入图片URL").optional(),
  stock: z.number().int().min(0, "库存不能为负").optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1, "请选择分类").optional(),
});

// GET /api/admin/products/[id] — 商品详情（含下架）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// PATCH /api/admin/products/[id] — 更新商品
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const result = productUpdateSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json({ product: updated });
}

// DELETE /api/admin/products/[id] — 删除商品（仅无关联订单时）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  if (product._count.orderItems > 0) {
    // 有历史订单关联，改为下架而非删除
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: "商品有历史订单关联，已改为下架" });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "已删除" });
}
