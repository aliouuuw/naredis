"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  AgencyOption,
  CustomerOption,
} from "@/components/declarations/new-declaration-form";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";
import { DeclarationsListView } from "@/components/declarations/declarations-list-view";
import { NewDeclarationDialog } from "@/components/declarations/new-declaration-dialog";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import { Button } from "@/components/ui/button";

export function DeclarationsPageView({
  rows,
  customers,
  agencies,
  canEdit,
}: {
  rows: DeclarationListItemSerialized[];
  customers: CustomerOption[];
  agencies: AgencyOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [presetCustomerId, setPresetCustomerId] = useState<string | undefined>();

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const customer = searchParams.get("customer") ?? undefined;
    setPresetCustomerId(customer);
    setNewDialogOpen(true);
    router.replace("/declarations", { scroll: false });
  }, [searchParams, router]);

  function openNewDeclaration(customerId?: string) {
    setPresetCustomerId(customerId);
    setNewDialogOpen(true);
  }

  return (
    <>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Créez votre première déclaration pour commencer.
          </p>
          {canEdit ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                className="rounded-full"
                onClick={() => openNewDeclaration()}
              >
                <Plus className="size-4" />
                Nouvelle déclaration
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <DeclarationsListView rows={rows} canEdit={canEdit} />
      )}

      {canEdit ? (
        <>
          <NewDeclarationDialog
            open={newDialogOpen}
            onOpenChange={(open) => {
              setNewDialogOpen(open);
              if (!open) setPresetCustomerId(undefined);
            }}
            customers={customers}
            agencies={agencies}
            defaultCustomerId={presetCustomerId}
            onRequestNewClient={() => setNewClientDialogOpen(true)}
            onCreated={(declarationId) => {
              router.push(`/declarations?open=${declarationId}`);
              router.refresh();
            }}
          />
          <NewCustomerDialog
            open={newClientDialogOpen}
            onOpenChange={setNewClientDialogOpen}
            onCreated={() => {
              router.refresh();
            }}
          />
        </>
      ) : null}
    </>
  );
}
