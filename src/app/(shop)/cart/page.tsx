import { getCart } from "@/lib/queries/cart";
import { redirect } from "next/navigation";
import { CartPageClient } from "@/components/shop/CartPageClient";

export default async function CartPage() {
  const cart = await getCart();

  if (!cart) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CartPageClient initialItems={cart.items} initialTotal={cart.total} />
    </div>
  );
}
