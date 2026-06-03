"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseTablePage } from "@/lib/ui/table-pagination";

export function useTablePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseTablePage(searchParams.get("page"));

  const setPage = useCallback(
    (next: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (next <= 1) sp.delete("page");
      else sp.set("page", String(next));
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearPage = useCallback(() => {
    if (!searchParams.get("page")) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return { page, setPage, clearPage };
}
