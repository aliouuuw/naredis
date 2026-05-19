import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuthContext();

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/declarations" className="font-semibold text-zinc-900">
              Ndouckmane Transit
            </Link>
            <Link href="/declarations" className="text-zinc-600 hover:text-zinc-900">
              Déclarations
            </Link>
            <Link href="/clients" className="text-zinc-600 hover:text-zinc-900">
              Clients
            </Link>
          </nav>
          <p className="text-sm text-zinc-500">{ctx.session.user.email}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
