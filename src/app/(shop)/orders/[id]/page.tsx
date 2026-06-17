import { getOrderById } from "@/lib/queries/orders";
import { redirect } from "next/navigation";
import { OrderDetailClient } from "@/components/shop/OrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await getOrderById(id);

  if (!order) {
    redirect("/orders");
  }

  // 序列化为纯对象传给客户端组件
  const serialized = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      productPrice: item.productPrice,
      subtotal: item.subtotal,
    })),
  };

  return <OrderDetailClient order={serialized} />;
}
