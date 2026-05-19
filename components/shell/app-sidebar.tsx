"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

/** Déclarations-first order — matches default landing and Notion main DB. */
const navItems = [
  {
    title: "Déclarations",
    href: "/declarations",
    icon: FileText,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Réglages",
    href: "/settings",
    icon: Settings,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-16 shrink-0 flex-row items-center gap-0 border-b border-sidebar-border px-4 py-0">
        <Link
          href="/declarations"
          className="flex min-h-0 min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
          >
            NT
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Ndouckmane Transit
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
