"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LoginFormDevCredentials = {
  email: string;
  password: string;
};

export function LoginForm({
  devCredentials,
}: {
  devCredentials?: LoginFormDevCredentials;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeRedirectPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function fillDevCredentials() {
    if (!devCredentials) return;
    setEmail(devCredentials.email);
    setPassword(devCredentials.password);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    setPending(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid email or password"
          ? "Email ou mot de passe incorrect."
          : (signInError.message ?? "Connexion impossible."),
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Adresse email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            required
            disabled={pending}
            placeholder="vous@cabinet.sn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={pending}
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={cn(
                "absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
              )}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Connexion en cours…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>

      {devCredentials ? (
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Développement local
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Après{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              bun run db:seed
            </code>
            , utilisez le compte démo.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={pending}
            onClick={fillDevCredentials}
          >
            Remplir le compte démo
          </Button>
        </div>
      ) : null}
    </form>
  );
}
