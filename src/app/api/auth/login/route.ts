import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // 不区分"用户不存在"和"密码错误"，防止撞库攻击
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  await setSession(user.id, user.role);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
