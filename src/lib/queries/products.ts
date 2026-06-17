import { prisma } from "@/lib/prisma";

export interface ProductFilters {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const { search = "", category = "", page = 1, pageSize = 9 } = filters;

  const where = {
    isActive: true,
    ...(search && { name: { contains: search } }),
    ...(category && { category: { slug: category } }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product || !product.isActive) return null;
  return product;
}
