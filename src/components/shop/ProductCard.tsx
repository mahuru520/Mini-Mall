import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: { name: string; slug: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-secondary mb-1">{product.category.name}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}
