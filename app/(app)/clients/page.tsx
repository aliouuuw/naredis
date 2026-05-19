import { requireAuthContext } from "@/lib/auth/session";

export default async function ClientsPage() {
  await requireAuthContext();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
      <p className="text-sm text-muted-foreground">
        À venir — liste des comptes clients (CLI-001).
      </p>
    </div>
  );
}
