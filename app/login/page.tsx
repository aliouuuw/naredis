import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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
        <p className="text-center text-sm text-zinc-600">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
