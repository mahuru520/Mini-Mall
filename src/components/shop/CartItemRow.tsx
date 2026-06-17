"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface CartItemRowProps {
  item: {
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
  };
  onUpdate: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function CartItemRow({ item, onUpdate, onRemove }: CartItemRowProps) {
  const [loading, setLoading] = useState(false);

  const isUnavailable = !item.product.isActive;
  const exceedsStock = item.quantity > item.product.stock;

  async function handleQuantityChange(newQuantity: number) {
    if (newQuantity < 1 || newQuantity > 99) return;
    setLoading(true);
    try {
      await onUpdate(item.id, newQuantity);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await onRemove(item.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex gap-4 py-4 border-b border-gray-100 ${isUnavailable ? "opacity-50" : ""}`}>
      {/* 商品图 */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.product.imageUrl}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 商品信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {item.product.name}
          {isUnavailable && <span className="text-danger ml-2">已下架</span>}
        </h3>
        <p className="text-sm text-primary font-bold mt-1">
          {formatCurrency(item.product.price)}
        </p>

        {/* 数量控制 */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={loading || item.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-sm disabled:opacity-40"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={loading || item.quantity >= item.product.stock}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-sm disabled:opacity-40"
          >
            +
          </button>
          {exceedsStock && (
            <span className="text-xs text-danger">库存仅 {item.product.stock} 件</span>
          )}
        </div>
      </div>

      {/* 小计 + 删除 */}
      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-bold text-gray-900">
          {formatCurrency(item.product.price * item.quantity)}
        </p>
        <button
          onClick={handleRemove}
          disabled={loading}
          className="text-xs text-danger hover:underline disabled:opacity-40"
        >
          移除
        </button>
      </div>
    </div>
  );
}
