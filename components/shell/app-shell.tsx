"use client";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppHeader } from "@/components/shell/app-header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  userEmail: string;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh flex-col">
        <AppHeader userEmail={userEmail} sidebarTrigger={<SidebarTrigger />} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
