import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AdminOrderDetailClient } from "@/components/admin/AdminOrderDetailClient";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const serialized = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      productPrice: item.productPrice,
      subtotal: item.subtotal,
    })),
  };

  return <AdminOrderDetailClient order={serialized} />;
}
