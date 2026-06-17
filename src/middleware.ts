import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

// 需要登录才能访问的路由
const PROTECTED_ROUTES = ["/cart", "/orders"];
// 需要 ADMIN 角色的路由
const ADMIN_ROUTES = ["/admin"];
// 已登录用户不应访问的页面
const AUTH_ROUTES = ["/login", "/register"];

async function verifySession(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request);

  // 需要登录的路由 — 未登录重定向到 /login
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 后台路由 — 需要 ADMIN 角色
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 登录/注册页 — 已登录重定向到首页
  if (AUTH_ROUTES.some((route) => pathname === route)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/orders/:path*", "/admin/:path*", "/login", "/register"],
};
