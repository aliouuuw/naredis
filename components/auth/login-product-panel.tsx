"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, Landmark, Users } from "lucide-react";
import { LoginPanelDecor } from "@/components/auth/login-panel-decor";
import { ProductMarkBlock } from "@/components/brand/product-mark";
import { productBrand } from "@/lib/branding";
import { cn } from "@/lib/utils";

const highlights: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: FileText,
    title: "Déclarations",
    description: "BL, bon à délivrer et montants fiche.",
  },
  {
    icon: Users,
    title: "Comptes clients",
    description: "Solde, relevé et réconciliation.",
  },
  {
    icon: Landmark,
    title: "Transactions",
    description: "Versements, charges et affectations.",
  },
];

export function LoginProductPanel() {
  return (
    <section
      className={cn(
        "login-product-panel relative hidden flex-1 flex-col overflow-hidden border-r lg:flex",
        "bg-foreground text-background",
        "border-background/10",
      )}
    >
      <div className="flex flex-1 flex-col p-10 lg:p-12">
        <div className="login-panel-enter login-panel-enter-1">
          <ProductMarkBlock variant="inverted" />
        </div>

        <div className="mt-10 flex flex-1 flex-col justify-center">
          <p className="login-panel-enter login-panel-enter-2 max-w-sm text-2xl font-semibold leading-[1.15] tracking-tight text-background">
            {productBrand.tagline}
          </p>
          <p className="login-panel-enter login-panel-enter-2 mt-3 max-w-sm text-sm leading-relaxed text-background/60">
            Un espace structuré pour le bureau et la comptabilité client.
          </p>

          <ul className="login-panel-enter login-panel-enter-3 mt-10 max-w-md space-y-0 divide-y divide-background/10">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0"
              >
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-background/45"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-background/95">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm text-background/55">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="mt-auto shrink-0 border-t border-background/10">
        <LoginPanelDecor />
        <p className="login-panel-enter login-panel-enter-4 px-10 pb-8 text-xs text-background/45 lg:px-12">
          Accès sur invitation · administrateur de l&apos;organisation
        </p>
      </footer>
    </section>
  );
}
