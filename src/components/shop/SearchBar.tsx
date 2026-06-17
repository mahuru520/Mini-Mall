"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useEffect } from "react";

interface SearchBarProps {
  basePath?: string;
}

export function SearchBar({ basePath = "/products" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }, [debouncedSearch, router, searchParams, basePath]);

  return (
    <label className="block">
      <span className="sr-only">搜索商品</span>
      <input
        type="text"
        placeholder="搜索商品..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  );
}
