import { requireAuthContext } from "@/lib/auth/session";

export default async function ClientsPage() {
  await requireAuthContext();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
      <p className="mt-2 text-sm text-zinc-600">À venir — liste des comptes clients.</p>
    </div>
  );
}
