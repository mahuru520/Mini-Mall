import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrderById, isValidTransition } from "@/lib/queries/orders";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const updateOrderSchema = z.object({
  status: z.enum(["PAID", "SHIPPED", "CANCELLED"]),
});

// GET /api/orders/[id] — 订单详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] — 更新订单状态（用户取消）
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
  const result = updateOrderSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { status: newStatus } = result.data;

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  // 用户只能取消订单
  if (newStatus !== "CANCELLED") {
    return NextResponse.json({ error: "无权执行此操作" }, { status: 403 });
  }

  if (!isValidTransition(order.status, newStatus)) {
    return NextResponse.json(
      { error: `订单状态不可从 ${order.status} 变更为 ${newStatus}` },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    // 取消订单 → 恢复库存
    for (const item of updatedOrder.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
