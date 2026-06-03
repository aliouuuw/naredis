import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { getDevAdminCredentials } from "@/lib/auth/seed-dev-admin";
import { isDevelopment } from "@/lib/auth/seed-guard";
import { getAppOrganizationIdForUser } from "@/lib/auth/org-context";
import { getSession } from "@/lib/auth/session";

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
  const { email, password } = getDevAdminCredentials();

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ndouckmane Transit
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre espace
          </p>
        </div>
        {error === "no_organization" ? (
          <p
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100"
            role="alert"
          >
            Ce compte n&apos;est rattaché à aucun cabinet. En local, exécutez{" "}
            <code className="font-mono">bun run db:seed</code> ou contactez
            l&apos;administrateur.
          </p>
        ) : null}
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
        >
          <LoginForm />
        </Suspense>
        {showDevHint ? (
          <div className="rounded-md border bg-card px-3 py-3 text-xs text-muted-foreground space-y-2">
            <p className="text-center">
              Dev — après <code className="font-mono">bun run db:seed</code>
            </p>
            <dl className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between gap-2">
                <dt>Email</dt>
                <dd className="text-foreground">{email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Mot de passe</dt>
                <dd className="text-foreground">{password}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
