import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function NewDeclarationButton() {
  return (
    <ButtonLink href="/declarations/new" className="rounded-full px-4">
      <Plus className="size-4" />
      Nouvelle déclaration
    </ButtonLink>
  );
}

export function NewClientButton() {
  return (
    <ButtonLink href="/clients/new" variant="outline" className="rounded-full px-4">
      <Plus className="size-4" />
      Nouveau client
    </ButtonLink>
  );
}
