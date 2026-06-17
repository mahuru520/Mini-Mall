"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getPaginationRange, cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  basePath?: string;
}

export function Pagination({ totalPages, basePath = "/products" }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  const range = getPaginationRange(currentPage, totalPages);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        上一页
      </button>
      {range.map((item, i) =>
        item === "..." ? (
          <span key={`dot-${i}`} className="px-2 text-secondary">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => goToPage(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={cn(
              "w-9 h-9 text-sm rounded border",
              item === currentPage
                ? "bg-primary text-white border-primary"
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        下一页
      </button>
    </div>
  );
}
