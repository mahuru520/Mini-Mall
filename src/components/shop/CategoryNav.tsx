"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: { id: string; name: string; slug: string; _count: { products: number } }[];
  basePath?: string;
}

export function CategoryNav({ categories, basePath = "/products" }: CategoryNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category") || "";

  function handleClick(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick("")}
        aria-pressed={!activeSlug}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          !activeSlug
            ? "bg-primary text-white"
            : "bg-gray-100 text-secondary hover:bg-gray-200"
        )}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.slug)}
          aria-pressed={activeSlug === cat.slug}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeSlug === cat.slug
              ? "bg-primary text-white"
              : "bg-gray-100 text-secondary hover:bg-gray-200"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
