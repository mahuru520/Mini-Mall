import { getProducts, getCategories } from "@/lib/queries/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { SearchBar } from "@/components/shop/SearchBar";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { Pagination } from "@/components/ui/Pagination";
import { Suspense } from "react";

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts({ search, category, page }),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 搜索 + 分类筛选 */}
      <div className="flex flex-col gap-4 mb-6">
        <Suspense>
          <SearchBar />
        </Suspense>
        <CategoryNav categories={categories} />
      </div>

      {/* 结果统计 */}
      <p className="text-sm text-secondary mb-4">
        共 {total} 件商品
        {search && ` · 搜索"${search}"`}
        {category && ` · ${categories.find((c) => c.slug === category)?.name || category}`}
      </p>

      {/* 商品网格 */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-secondary">
          <p className="text-lg">未找到商品</p>
          <p className="text-sm mt-1">试试调整搜索条件或切换分类</p>
        </div>
      )}

      {/* 分页 */}
      <Pagination totalPages={totalPages} />
    </div>
  );
}
