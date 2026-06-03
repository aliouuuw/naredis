"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DownloadAccountStatementButtonProps = {
  customerId: string;
  className?: string;
  /** Short label for the header row. */
  label?: string;
  size?: "default" | "sm";
};

export function DownloadAccountStatementButton({
  customerId,
  className,
  label = "Télécharger le relevé (Excel)",
  size = "default",
}: DownloadAccountStatementButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${customerId}/releve`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `releve-${customerId}.xlsx`;

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
      setError("Impossible de télécharger le relevé. Réessayez.");
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
        className={cn("rounded-full", size === "sm" && "h-8")}
        disabled={pending}
        onClick={() => void handleDownload()}
      >
        <FileSpreadsheet className="size-4" aria-hidden />
        {pending ? "Téléchargement…" : label}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
