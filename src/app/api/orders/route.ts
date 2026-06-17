import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOrder, getMyOrders } from "@/lib/queries/orders";

// GET /api/orders — 获取我的订单列表
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const orders = await getMyOrders();
  return NextResponse.json({ orders });
}

// POST /api/orders — 下单
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const order = await createOrder();
    if (!order) {
      return NextResponse.json({ error: "下单失败" }, { status: 400 });
    }
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "下单失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
