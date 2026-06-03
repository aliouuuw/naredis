import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormAlert({
  variant,
  children,
  className,
}: {
  variant: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "error" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        variant === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        variant === "info" &&
          "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
