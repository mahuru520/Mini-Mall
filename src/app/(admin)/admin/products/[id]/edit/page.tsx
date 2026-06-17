import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/admin/ProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    }),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      categories={categories}
      mode="edit"
      productId={product.id}
      initialData={{
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        isActive: product.isActive,
        categoryId: product.categoryId,
      }}
    />
  );
}
