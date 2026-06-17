import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const addToCartSchema = z.object({
  productId: z.string().min(1, "缺少商品ID"),
  quantity: z.number().int().min(1, "数量至少为1").max(99, "单次最多99件"),
});

// GET /api/cart — 获取当前用户购物车
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { select: { id: true, name: true, price: true, imageUrl: true, stock: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return NextResponse.json({ items: cartItems, total });
}

// POST /api/cart — 添加商品到购物车
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const result = addToCartSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { productId, quantity } = result.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
  }

  if (product.stock < quantity) {
    return NextResponse.json({ error: "库存不足" }, { status: 400 });
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: session.userId, productId, quantity },
  });

  return NextResponse.json({ message: "已加入购物车" });
}
