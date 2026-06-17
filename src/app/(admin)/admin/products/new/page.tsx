import { getCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await getCategories();
  return <ProductForm categories={categories} mode="create" />;
}
