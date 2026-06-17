import { getProductById } from "@/lib/queries/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-secondary mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-primary">首页</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* 商品内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 大图 */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 信息 */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-secondary mb-1">{product.category.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          </div>

          <p className="text-3xl font-bold text-primary">
            {formatCurrency(product.price)}
          </p>

          <p className="text-gray-700 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-secondary">库存：</span>
            <span className={product.stock > 0 ? "text-success" : "text-danger"}>
              {product.stock > 0 ? `${product.stock} 件` : "已售罄"}
            </span>
          </div>

          <div className="mt-4">
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        </div>
      </div>
    </div>
  );
}
