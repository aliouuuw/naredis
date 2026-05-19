import { requireAuthContext } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/button";

export default async function NewDeclarationPage() {
  await requireAuthContext();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouvelle déclaration
        </h1>
        <p className="text-sm text-muted-foreground">
          Formulaire de création — à venir (DECL-002).
        </p>
      </div>
      <ButtonLink href="/declarations" variant="outline">
        Retour aux déclarations
      </ButtonLink>
    </div>
  );
}
