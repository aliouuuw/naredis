"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DownloadExcelButtonProps = {
  /** Full path including query string, e.g. `/api/declarations/export?view=pending` */
  exportUrl: string;
  className?: string;
  label?: string;
  size?: "default" | "sm";
  errorMessage?: string;
};

export function DownloadExcelButton({
  exportUrl,
  className,
  label = "Exporter Excel",
  size = "sm",
  errorMessage = "Impossible de télécharger le fichier. Réessayez.",
}: DownloadExcelButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(exportUrl, { credentials: "same-origin" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "export.xlsx";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(errorMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-stretch gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size={size === "sm" ? "sm" : "default"}
        className={cn("h-8 gap-1.5 rounded-full", size !== "sm" && "rounded-full")}
        disabled={pending}
        onClick={() => void handleDownload()}
      >
        <FileSpreadsheet className="size-3.5" aria-hidden />
        {pending ? "Export…" : label}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
