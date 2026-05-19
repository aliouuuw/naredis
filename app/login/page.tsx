import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
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
      redirect("/declarations");
    }
  }

  const showDevHint = isDevelopment();
  const { email } = getDevAdminCredentials();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/30 px-4 py-12">
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
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
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
          <p className="rounded-md border bg-card px-3 py-2 text-center text-xs text-muted-foreground">
            Dev — après <code className="font-mono">bun run db:seed</code>
            <br />
            <span className="font-mono">{email}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
