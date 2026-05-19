"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type AppHeaderProps = {
  userEmail: string;
  sidebarTrigger: React.ReactNode;
};

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export function AppHeader({ userEmail, sidebarTrigger }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      {sidebarTrigger}
      <Separator orientation="vertical" className="mr-1 hidden h-6 md:block" />
      <div className="relative hidden max-w-md flex-1 md:flex">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher… (⌘K bientôt)"
          className="h-9 bg-muted/40 pl-9"
          disabled
          aria-label="Rechercher"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-9 max-w-56 gap-2 px-2"
                aria-label="Menu utilisateur"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{initialsFromEmail(userEmail)}</AvatarFallback>
            </Avatar>
            <span className="hidden truncate text-sm font-medium sm:inline">
              {userEmail}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">Connecté</p>
              <p className="truncate text-sm font-medium">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
