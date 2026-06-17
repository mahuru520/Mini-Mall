import { getDashboardStats } from "@/lib/queries/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "商品总数", value: stats.productCount, sub: `${stats.activeProductCount} 在售` },
    { label: "订单总数", value: stats.orderCount },
    { label: "用户总数", value: stats.userCount },
    { label: "总收入", value: formatCurrency(stats.totalRevenue) },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <p className="text-sm text-secondary">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            {card.sub && (
              <p className="text-xs text-secondary mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* 最近订单 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">最近订单</h2>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-secondary text-center">暂无订单</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-secondary text-left">
                <th className="px-5 py-3 font-medium">订单号</th>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 font-mono text-xs">
                    {order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3">{order.user.name || "-"}</td>
                  <td className="px-5 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3 text-secondary">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
