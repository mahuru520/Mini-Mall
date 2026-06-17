import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const productSchema = z.object({
  name: z.string().min(1, "请输入商品名称").max(200),
  description: z.string().min(1, "请输入商品描述"),
  price: z.number().min(0.01, "价格必须大于0"),
  imageUrl: z.string().min(1, "请输入图片URL"),
  stock: z.number().int().min(0, "库存不能为负"),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1, "请选择分类"),
});

// GET /api/admin/products — 商品列表（含下架）
export async function GET(request: Request) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = 20;

  const where = {
    ...(search && { name: { contains: search } }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// POST /api/admin/products — 新建商品
export async function POST(request: Request) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const body = await request.json();
  const result = productSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "输入不合法";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const product = await prisma.product.create({ data: result.data });

  return NextResponse.json({ product }, { status: 201 });
}
