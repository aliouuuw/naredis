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

  const openDeclaration = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    openDeclaration(openId);
    router.replace("/declarations", { scroll: false });
  }, [searchParams, openDeclaration, router]);

  function handleSheetOpenChange(next: boolean) {
    setSheetOpen(next);
    if (!next) {
      setSelectedId(null);
    }
  }

  return (
    <>
      <DeclarationsTable rows={rows} onOpenRow={openDeclaration} />
      <DeclarationFicheSheet
        declarationId={selectedId}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        canEdit={canEdit}
      />
    </>
  );
}
