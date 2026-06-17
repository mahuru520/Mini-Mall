import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 状态机：合法转换
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: [], // 终态
  CANCELLED: [], // 终态
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function getMyOrders() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

export async function getOrderById(id: string) {
  const session = await getSession();
  if (!session) return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!order || order.userId !== session.userId) return null;
  return order;
}

/** 下单：事务创建订单 + 价格快照 + 清空购物车，然后模拟支付 */
export async function createOrder() {
  const session = await getSession();
  if (!session) return null;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
  });

  const validItems = cartItems.filter((item) => item.product.isActive);

  if (validItems.length === 0) {
    throw new Error("购物车中没有可购买的商品");
  }

  // 检查库存
  for (const item of validItems) {
    if (item.product.stock < item.quantity) {
      throw new Error(`"${item.product.name}" 库存不足，仅剩 ${item.product.stock} 件`);
    }
  }

  const total = validItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const order = await prisma.$transaction(async (tx) => {
    // 1. 创建订单 + 价格快照
    const newOrder = await tx.order.create({
      data: {
        userId: session.userId,
        status: "PENDING",
        total,
        items: {
          create: validItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    // 2. 扣减库存
    for (const item of validItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. 清空购物车
    await tx.cartItem.deleteMany({
      where: { userId: session.userId },
    });

    return newOrder;
  });

  // 4. 模拟支付：直接 PENDING → PAID
  const paidOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  return paidOrder;
}
