import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const status = params.status || "";
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;

  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const where = { ...(status && { status }) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  const serialized = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <AdminOrdersClient
      initialOrders={serialized}
      initialTotal={total}
      initialPage={page}
      initialTotalPages={Math.ceil(total / pageSize)}
    />
  );
}
