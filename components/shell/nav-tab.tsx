"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavTabProps = {
  href: string;
  children: React.ReactNode;
};

export function NavTab({ href, children }: NavTabProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative inline-flex h-full items-center px-3 text-sm font-medium transition-colors",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-3 bottom-0 h-px bg-foreground transition-opacity",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}
