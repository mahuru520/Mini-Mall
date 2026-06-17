import { getMyOrders } from "@/lib/queries/orders";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";

export default async function OrdersPage() {
  const orders = await getMyOrders();

  if (!orders) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-secondary">暂无订单</p>
          <Link href="/" className="text-sm text-primary hover:underline mt-2 block">
            去逛逛 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary">
                    {formatDate(order.createdAt)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <span className="text-xs text-secondary">
                    +{order.items.length - 3} 件
                  </span>
                )}
                <span className="text-xs text-secondary ml-auto">
                  共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
