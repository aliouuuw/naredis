import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Créer un compte
          </h1>
          <p className="text-sm text-zinc-600">
            Premier utilisateur = création du cabinet
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-zinc-600">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
