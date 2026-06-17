"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import Link from "next/link";

interface AdminOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string };
  items: { productName: string; quantity: number }[];
}

interface AdminOrdersClientProps {
  initialOrders: AdminOrder[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

export function AdminOrdersClient({
  initialOrders,
  initialTotal,
  initialPage,
  initialTotalPages,
}: AdminOrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState<string | null>(null); // order id being updated

  const currentStatus = searchParams.get("status") || "";

  function filterByStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/admin/orders?${params.toString()}`);
  }

  async function handleShip(orderId: string) {
    if (!confirm("确认发货？")) return;
    setLoading(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "操作失败");
        return;
      }

      router.refresh();
    } catch {
      alert("网络错误，请重试");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm("确认取消此订单？库存将恢复。")) return;
    setLoading(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "操作失败");
        return;
      }

      router.refresh();
    } catch {
      alert("网络错误，请重试");
    } finally {
      setLoading(null);
    }
  }

  const statusFilters = [
    { value: "", label: "全部" },
    { value: "PENDING", label: "待付款" },
    { value: "PAID", label: "已付款" },
    { value: "SHIPPED", label: "已发货" },
    { value: "CANCELLED", label: "已取消" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">订单管理</h1>
        <span className="text-sm text-secondary">共 {initialTotal} 笔</span>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => filterByStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStatus === f.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-secondary text-left">
              <th className="px-4 py-3 font-medium">订单号</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">金额</th>
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {order.id.slice(-8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3 text-secondary">
                  {order.user.name || order.user.email}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                <td className="px-4 py-3 text-secondary text-xs">
                  {order.items.map((i) => i.productName).join("、")}
                </td>
                <td className="px-4 py-3 text-secondary text-xs">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 space-x-2">
                  {order.status === "PAID" && (
                    <button
                      onClick={() => handleShip(order.id)}
                      disabled={loading === order.id}
                      className="text-success hover:underline text-xs disabled:opacity-40"
                    >
                      发货
                    </button>
                  )}
                  {(order.status === "PENDING" || order.status === "PAID") && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={loading === order.id}
                      className="text-danger hover:underline text-xs disabled:opacity-40"
                    >
                      取消
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="text-center py-8 text-secondary">暂无订单</p>
        )}
      </div>

      {/* 分页 */}
      {initialTotalPages > 1 && (
        <div className="flex justify-center gap-1 mt-6">
          {Array.from({ length: initialTotalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(p));
                router.push(`/admin/orders?${params.toString()}`);
              }}
              className={`w-9 h-9 text-sm rounded border ${
                p === initialPage
                  ? "bg-primary text-white border-primary"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
