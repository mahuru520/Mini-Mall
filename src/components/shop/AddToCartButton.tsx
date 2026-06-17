"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string } | null;

export function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleAdd() {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: "error", text: data.error || "添加失败" });
        return;
      }

      setFeedback({ type: "success", text: "已加入购物车" });
    } catch {
      setFeedback({ type: "error", text: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAdd}
        disabled={stock === 0 || loading}
        className="w-full py-3 px-6 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "添加中..." : stock === 0 ? "已售罄" : "加入购物车"}
      </button>
      {feedback && (
        <p className={`text-sm ${feedback.type === "error" ? "text-danger" : "text-success"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
