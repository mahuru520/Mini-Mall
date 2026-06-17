import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const categoryUpdateSchema = z.object({
  name: z.string().min(1, "请输入分类名称").max(50).optional(),
  description: z.string().optional(),
  slug: z.string().min(1, "请输入slug").max(50).optional(),
});

// PATCH /api/admin/categories/[id] — 更新分类
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const result = categoryUpdateSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }

  // 检查 name/slug 唯一性
  if (result.data.name || result.data.slug) {
    const conflict = await prisma.category.findFirst({
      where: {
        OR: [
          ...(result.data.name ? [{ name: result.data.name }] : []),
          ...(result.data.slug ? [{ slug: result.data.slug }] : []),
        ],
        NOT: { id },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "分类名或slug已存在" }, { status: 409 });
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(result.data.name && { name: result.data.name }),
      ...(result.data.description !== undefined && { description: result.data.description || null }),
      ...(result.data.slug && { slug: result.data.slug }),
    },
  });

  return NextResponse.json({ category: updated });
}

// DELETE /api/admin/categories/[id] — 删除分类
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      { error: `该分类下有 ${category._count.products} 件商品，无法删除` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ message: "已删除" });
}
