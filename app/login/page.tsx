import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProductMark } from "@/components/brand/product-mark";
import { LoginForm } from "@/components/auth/login-form";
import { LoginProductPanel } from "@/components/auth/login-product-panel";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { productPageTitle } from "@/lib/branding";
import { FormAlert } from "@/components/ui/form-feedback";
import { getDevAdminCredentials } from "@/lib/auth/seed-dev-admin";
import { isDevelopment } from "@/lib/auth/seed-guard";
import { getAppOrganizationIdForUser } from "@/lib/auth/org-context";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: productPageTitle("Connexion"),
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const session = await getSession();

  if (session) {
    const organizationId = await getAppOrganizationIdForUser(session.user.id);
    if (organizationId) {
      redirect("/dashboard");
    }
  }

  const showDevHint = isDevelopment();
  const devCredentials = showDevHint ? getDevAdminCredentials() : undefined;

  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <LoginProductPanel />

      <section className="relative flex flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <ProductMark className="lg:hidden" href="/login" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-[400px] space-y-6">
            <div className="space-y-1.5 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">
                Connexion
              </h1>
              <p className="text-sm text-muted-foreground">
                Identifiants fournis par votre administrateur.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              {error === "no_organization" ? (
                <div className="mb-5">
                  <FormAlert
                    variant="info"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                  >
                    Ce compte n&apos;est rattaché à aucun cabinet. En local,
                    exécutez{" "}
                    <code className="font-mono text-xs">bun run db:reseed</code>{" "}
                    ou contactez l&apos;administrateur.
                  </FormAlert>
                </div>
              ) : null}

              <Suspense
                fallback={
                  <div className="space-y-4" aria-busy="true">
                    <div className="h-9 animate-pulse rounded-lg bg-muted" />
                    <div className="h-9 animate-pulse rounded-lg bg-muted" />
                    <div className="h-10 animate-pulse rounded-lg bg-muted" />
                  </div>
                }
              >
                <LoginForm devCredentials={devCredentials} />
              </Suspense>
            </div>

            <p className="text-center text-xs text-muted-foreground lg:text-left">
              Besoin d&apos;un accès ? Adressez-vous au responsable de votre
              organisation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
