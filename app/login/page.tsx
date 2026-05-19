import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getDevAdminCredentials } from "@/lib/auth/seed-dev-admin";

export default function LoginPage() {
  const { email } = getDevAdminCredentials();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Ndouckmane Transit
          </h1>
          <p className="text-sm text-zinc-600">Connectez-vous à votre espace</p>
        </div>
        <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
          <LoginForm />
        </Suspense>
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-xs text-zinc-600">
          Dev — après <code className="font-mono">bun run db:seed</code>
          <br />
          <span className="font-mono">{email}</span>
        </p>
      </div>
    </div>
  );
}
