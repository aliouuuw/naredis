"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Maximize2 } from "lucide-react";
import {
  getDeclarationFicheAction,
  listAgenciesForFormAction,
} from "@/lib/actions/declaration-fiche";
import { DeclarationFicheBody } from "@/components/declarations/declaration-fiche-body";
import type { AgencyOption } from "@/components/declarations/new-declaration-form";
import type { DeclarationFicheSerialized } from "@/lib/modules/declarations/serialize-fiche";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function DeclarationFicheSheet({
  declarationId,
  open,
  onOpenChange,
  canEdit,
}: {
  declarationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}) {
  const [fiche, setFiche] = useState<DeclarationFicheSerialized | null>(null);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadFiche = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const [ficheResult, agenciesResult] = await Promise.all([
      getDeclarationFicheAction(id),
      listAgenciesForFormAction(),
    ]);

    setLoading(false);

    if (!ficheResult.ok || !ficheResult.data) {
      setFiche(null);
      setError(ficheResult.ok ? "Réponse invalide." : ficheResult.error);
      return;
    }

    setFiche(ficheResult.data);
    if (agenciesResult.ok && agenciesResult.data) {
      setAgencies(agenciesResult.data);
    }
  }, []);

  useEffect(() => {
    if (!open || !declarationId) {
      return;
    }
    void loadFiche(declarationId);
  }, [open, declarationId, loadFiche]);

  useEffect(() => {
    if (!open) {
      setModalOpen(false);
    }
  }, [open]);

  function handleSaved() {
    if (declarationId) {
      void loadFiche(declarationId);
    }
  }

  const headerTitle = fiche?.declarationNumber ?? "Déclaration";
  const headerDescription = fiche
    ? `${fiche.customer.name} · BL ${fiche.dossier.blReference ?? "—"}`
    : "Chargement de la fiche…";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        >
          <SheetHeader className="shrink-0 border-b px-6 py-4 pr-14">
            <SheetTitle className="text-left">{headerTitle}</SheetTitle>
            <SheetDescription className="text-left">
              {headerDescription}
            </SheetDescription>
            {fiche ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <ButtonLink
                  href={`/dossiers/${fiche.dossier.id}`}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <FolderOpen className="size-3.5" aria-hidden />
                  Ouvrir le dossier
                </ButtonLink>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setModalOpen(true)}
                >
                  <Maximize2 className="size-3.5" aria-hidden />
                  Agrandir
                </Button>
              </div>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <DeclarationFicheBody
              loading={loading}
              error={error}
              fiche={fiche}
              agencies={agencies}
              canEdit={canEdit}
              variant="sheet"
              onSaved={handleSaved}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[min(92vh,960px)] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 p-0">
          <DialogHeader>
            <DialogTitle>{headerTitle}</DialogTitle>
            <DialogDescription>{headerDescription}</DialogDescription>
          </DialogHeader>
          <DialogBody className="min-h-0 flex-1">
            <DeclarationFicheBody
              loading={loading}
              error={error}
              fiche={fiche}
              agencies={agencies}
              canEdit={canEdit}
              variant="page"
              onSaved={handleSaved}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
