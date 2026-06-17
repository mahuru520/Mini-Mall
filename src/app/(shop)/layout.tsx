import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/shared/LogoutButton";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Mini Mall
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-secondary hover:text-primary">
              首页
            </Link>
            <Link href="/products" className="text-sm text-secondary hover:text-primary">
              全部商品
            </Link>
            {user && (
              <>
                <Link href="/cart" className="text-sm text-secondary hover:text-primary">
                  购物车
                </Link>
                <Link href="/orders" className="text-sm text-secondary hover:text-primary">
                  我的订单
                </Link>
              </>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="text-sm text-warning font-medium">
                后台管理
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-secondary">{user.name}</span>
                <LogoutButton />
              </div>
            ) : (
              <Link href="/login" className="text-sm text-primary font-medium">
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-secondary">
          © 2026 Mini Mall — 微型电商演示项目
        </div>
      </footer>
    </div>
  );
}
