"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CartItemRow } from "@/components/shop/CartItemRow";
import { CartSummary } from "@/components/shop/CartSummary";
import Link from "next/link";

interface CartPageClientProps {
  initialItems: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string;
      stock: number;
      isActive: boolean;
    };
  }[];
  initialTotal: number;
}

export function CartPageClient({ initialItems, initialTotal }: CartPageClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasUnavailable = items.some((item) => !item.product.isActive);
  const validItemCount = items
    .filter((item) => item.product.isActive)
    .reduce((sum, item) => sum + item.quantity, 0);

  const refreshCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    }
    router.refresh();
  }, [router]);

  const handleUpdate = useCallback(
    async (id: string, quantity: number) => {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "更新失败");
        return;
      }
      setError("");
      await refreshCart();
    },
    [refreshCart]
  );

  const handleRemove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });

      if (!res.ok) {
        setError("移除失败");
        return;
      }
      setError("");
      await refreshCart();
    },
    [refreshCart]
  );

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "下单失败");
        return;
      }

      router.push(`/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-secondary mb-2">购物车是空的</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          去逛逛 →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 商品列表 */}
      <div className="lg:col-span-2">
        <h1 className="text-xl font-bold text-gray-900 mb-4">购物车</h1>
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* 订单摘要 */}
      <div>
        <CartSummary
          total={total}
          itemCount={validItemCount}
          onCheckout={handleCheckout}
          loading={loading}
          disabled={hasUnavailable}
        />
      </div>
    </div>
  );
}
