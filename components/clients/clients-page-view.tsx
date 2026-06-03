"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";
import { ClientsTable } from "./clients-table";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";
import { Button } from "@/components/ui/button";

export function ClientsPageView({ rows }: { rows: CustomerListItemSerialized[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setNewDialogOpen(true);
    router.replace("/clients", { scroll: false });
  }, [searchParams, router]);

  return (
    <>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun client pour le moment.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setNewDialogOpen(true)}
            >
              <Plus className="size-4" />
              Nouveau client
            </Button>
          </div>
        </div>
      ) : (
        <ClientsTable rows={rows} />
      )}

      <NewCustomerDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onCreated={(customerId) => {
          router.push(`/clients/${customerId}`);
          router.refresh();
        }}
      />
    </>
  );
}
