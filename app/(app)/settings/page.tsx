import { requireAuthContext } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requireAuthContext();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
      <p className="text-sm text-muted-foreground">
        Cabinet et membres — à venir (POL-003).
      </p>
    </div>
  );
}
