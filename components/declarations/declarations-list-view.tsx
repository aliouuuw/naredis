"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DeclarationFicheSheet } from "@/components/declarations/declaration-fiche-sheet";
import { DeclarationsTable } from "@/components/declarations/declarations-table";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";

export function DeclarationsListView({
  rows,
  canEdit,
}: {
  rows: DeclarationListItemSerialized[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDeclaration = useCallback(
    (id: string, { syncUrl = true }: { syncUrl?: boolean } = {}) => {
      setSelectedId(id);
      setSheetOpen(true);
      if (syncUrl && searchParams.get("open") !== id) {
        router.push(`/declarations?open=${id}`, { scroll: false });
      }
    },
    [router, searchParams],
  );

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    openDeclaration(openId, { syncUrl: false });
  }, [searchParams, openDeclaration]);

  function handleSheetOpenChange(next: boolean) {
    setSheetOpen(next);
    if (!next) {
      setSelectedId(null);
      if (searchParams.get("open")) {
        router.replace("/declarations", { scroll: false });
      }
    }
  }

  return (
    <>
      <DeclarationsTable
        rows={rows}
        onOpenRow={(id) => openDeclaration(id)}
      />
      <DeclarationFicheSheet
        declarationId={selectedId}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        canEdit={canEdit}
      />
    </>
  );
}
