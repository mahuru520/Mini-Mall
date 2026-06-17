import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [productCount, activeProductCount, orderCount, userCount, totalRevenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "SHIPPED"] } },
      }),
    ]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      items: { select: { productName: true } },
    },
  });

  return {
    productCount,
    activeProductCount,
    orderCount,
    userCount,
    totalRevenue: totalRevenue._sum.total ?? 0,
    recentOrders,
  };
}
