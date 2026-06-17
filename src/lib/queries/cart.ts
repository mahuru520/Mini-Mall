import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getCart() {
  const session = await getSession();
  if (!session) return null;

  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: {
      product: {
        select: { id: true, name: true, price: true, imageUrl: true, stock: true, isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = items.reduce((sum, item) => {
    if (item.product.isActive) {
      return sum + item.product.price * item.quantity;
    }
    return sum;
  }, 0);

  return { items, total };
}
