import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(1, "请输入用户名").max(50, "用户名过长"),
  email: z.email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "CUSTOMER" },
  });

  await setSession(user.id, user.role);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }, { status: 201 });
}
