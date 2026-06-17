import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const categorySchema = z.object({
  name: z.string().min(1, "请输入分类名称").max(50),
  description: z.string().optional(),
  slug: z.string().min(1, "请输入slug").max(50),
});

// GET /api/admin/categories — 分类列表
export async function GET() {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

// POST /api/admin/categories — 新建分类
export async function POST(request: Request) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const body = await request.json();
  const result = categorySchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, description, slug } = result.data;

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return NextResponse.json({ error: "分类名或slug已存在" }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: { name, description: description || null, slug },
  });

  return NextResponse.json({ category }, { status: 201 });
}
