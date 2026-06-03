"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NavTab } from "@/components/shell/nav-tab";
import { ThemeMenuItems } from "@/components/shell/theme-menu-items";

const tabs = [
  { title: "Tableau de bord", href: "/dashboard" },
  { title: "Déclarations", href: "/declarations" },
  { title: "Clients", href: "/clients" },
  { title: "Transactions", href: "/transactions" },
  { title: "Réglages", href: "/settings" },
] as const;

type AppTopNavProps = {
  userEmail: string;
};

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export function AppTopNav({ userEmail }: AppTopNavProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      const { error } = await authClient.signOut();
      if (error) {
        console.error("Déconnexion:", error.message);
      }
    } catch (err) {
      console.error("Déconnexion:", err);
    }

    // Full navigation avoids RSC refresh races on protected routes (router.refresh
    // on /dashboard while session is clearing caused "This page couldn't load").
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Row 1 — chrome: logo, search, user (Vercel-style) */}
      <div className="flex h-16 items-center gap-3 px-4 md:gap-4 md:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
          >
            NT
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Ndouckmane Transit
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block" aria-hidden />

        <div className="relative ml-auto w-full max-w-sm md:ml-0 md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher… ⌘K"
            className="h-9 w-full bg-muted/40 pl-9"
            disabled
            aria-label="Rechercher"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-9 max-w-56 shrink-0 gap-2 px-2"
                aria-label="Menu utilisateur"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{initialsFromEmail(userEmail)}</AvatarFallback>
            </Avatar>
            <span className="hidden truncate text-sm font-medium lg:inline">
              {userEmail}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Connecté</p>
                <p className="truncate text-sm font-medium">{userEmail}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={signingOut}
                onClick={() => void handleSignOut()}
              >
                <LogOut className="size-4" />
                {signingOut ? "Déconnexion…" : "Se déconnecter"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <ThemeMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 2 — primary navigation tabs */}
      <nav
        aria-label="Navigation principale"
        className="flex h-10 items-stretch overflow-x-auto border-t border-border px-4 md:px-6"
      >
        {tabs.map((tab) => (
          <NavTab key={tab.href} href={tab.href}>
            {tab.title}
          </NavTab>
        ))}
      </nav>
    </header>
  );
}
