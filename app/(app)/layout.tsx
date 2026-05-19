import { AppShell } from "@/components/shell/app-shell";
import { requireAuthContext } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuthContext();

  return <AppShell userEmail={ctx.session.user.email}>{children}</AppShell>;
}
