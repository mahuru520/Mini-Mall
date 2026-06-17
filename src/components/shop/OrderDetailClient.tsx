"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";

interface OrderDetailClientProps {
  order: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    items: {
      id: string;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
      product: { id: string; name: string; imageUrl: string };
    }[];
  };
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCancel = order.status === "PENDING" || order.status === "PAID";

  async function handleCancel() {
    if (!confirm("确定要取消此订单吗？取消后库存将恢复。")) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "取消失败");
        return;
      }

      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 订单头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
          <p className="text-sm text-secondary mt-1">
            订单号：{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {/* 订单信息卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-secondary">下单时间</span>
          <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
        </div>

        {/* 商品列表 */}
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product.imageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  单价 {formatCurrency(item.productPrice)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        {/* 合计 */}
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">合计</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full py-2.5 border border-danger text-danger font-medium rounded-lg hover:bg-danger hover:text-white disabled:opacity-40 transition-colors"
        >
          {loading ? "取消中..." : "取消订单"}
        </button>
      )}
    </div>
  );
}
