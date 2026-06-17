import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-warning text-white" },
  PAID: { label: "已付款", color: "bg-info text-white" },
  SHIPPED: { label: "已发货", color: "bg-success text-white" },
  CANCELLED: { label: "已取消", color: "bg-secondary text-white" },
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-300 text-gray-700" };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.color)}>
      {config.label}
    </span>
  );
}
