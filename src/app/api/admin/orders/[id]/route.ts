import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isValidTransition } from "@/lib/queries/orders";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const adminUpdateOrderSchema = z.object({
  status: z.enum(["PAID", "SHIPPED", "CANCELLED"]),
});

// GET /api/admin/orders/[id] — 订单详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// PATCH /api/admin/orders/[id] — 管理员更新订单状态（发货/取消）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const result = adminUpdateOrderSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { status: newStatus } = result.data;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
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
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    // 取消订单 → 恢复库存
    if (newStatus === "CANCELLED") {
      for (const item of updatedOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
