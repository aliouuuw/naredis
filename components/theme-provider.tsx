"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * next-themes injects a <script> for FOUC prevention; React 19 forbids executable
 * scripts inside Client Components. We run the blocking script from ThemeScript
 * in the root layout instead and mark the provider script as inert on the client.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      scriptProps={{ type: "application/json", suppressHydrationWarning: true }}
    >
      {children}
    </NextThemesProvider>
  );
}
