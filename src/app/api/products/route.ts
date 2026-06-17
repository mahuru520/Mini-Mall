import { NextResponse } from "next/server";
import { getProducts } from "@/lib/queries/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const result = await getProducts({ search, category, page });

  return NextResponse.json(result);
}
