"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";

interface AdminOrderDetailProps {
  order: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    user: { name: string | null; email: string };
    items: {
      id: string;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
      productId: string;
      product: { id: string; name: string; imageUrl: string };
    }[];
  };
}

export function AdminOrderDetailClient({ order }: AdminOrderDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canShip = order.status === "PAID";
  const canCancel = order.status === "PENDING" || order.status === "PAID";

  async function handleUpdateStatus(newStatus: "SHIPPED" | "CANCELLED") {
    const label = newStatus === "SHIPPED" ? "确认发货" : "取消订单";
    if (!confirm(`确定要${label}吗？`)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
          <p className="text-sm text-secondary mt-1">
            订单号：{order.id.slice(-8).toUpperCase()} · 用户：{order.user.name || order.user.email}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="text-sm text-secondary mb-4">
          下单时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img src={item.product.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                <p className="text-xs text-secondary">单价 {formatCurrency(item.productPrice)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
          <span className="text-sm font-medium">合计</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {canShip && (
          <button
            onClick={() => handleUpdateStatus("SHIPPED")}
            disabled={loading}
            className="px-6 py-2.5 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 disabled:opacity-40 transition-colors"
          >
            确认发货
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => handleUpdateStatus("CANCELLED")}
            disabled={loading}
            className="px-6 py-2.5 border border-danger text-danger text-sm font-medium rounded-lg hover:bg-danger hover:text-white disabled:opacity-40 transition-colors"
          >
            取消订单
          </button>
        )}
      </div>
    </div>
  );
}
