import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateCartSchema = z.object({
  quantity: z.number().int().min(1, "数量至少为1").max(99, "单次最多99件"),
});

// PATCH /api/cart/[id] — 修改购物车商品数量
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const result = updateCartSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { quantity } = result.data;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id },
    include: { product: { select: { stock: true } } },
  });

  if (!cartItem || cartItem.userId !== session.userId) {
    return NextResponse.json({ error: "购物车商品不存在" }, { status: 404 });
  }

  if (cartItem.product.stock < quantity) {
    return NextResponse.json({ error: "库存不足" }, { status: 400 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  return NextResponse.json(updated);
}

// DELETE /api/cart/[id] — 移除购物车商品
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;

  const cartItem = await prisma.cartItem.findUnique({ where: { id } });

  if (!cartItem || cartItem.userId !== session.userId) {
    return NextResponse.json({ error: "购物车商品不存在" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  return NextResponse.json({ message: "已移除" });
}
