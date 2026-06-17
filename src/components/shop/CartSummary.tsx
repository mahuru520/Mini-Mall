"use client";

import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  total: number;
  itemCount: number;
  onCheckout: () => void;
  loading: boolean;
  disabled: boolean;
}

export function CartSummary({ total, itemCount, onCheckout, loading, disabled }: CartSummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">订单摘要</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-secondary">商品数量</span>
          <span>{itemCount} 件</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">商品合计</span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">运费</span>
          <span className="text-success">免运费</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
        <span className="font-bold text-gray-900">总计</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
      </div>

      <button
        onClick={onCheckout}
        disabled={disabled || loading}
        className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "提交中..." : "去结算"}
      </button>

      {disabled && (
        <p className="text-xs text-danger text-center">购物车中有不可购买的商品，请先移除</p>
      )}
    </div>
  );
}
