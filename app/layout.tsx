import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { productBrand } from "@/lib/branding";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-sans-flex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  // Google Sans Flex is not in Next's capsized metrics DB — avoids dev warning.
  adjustFontFallback: false,
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: productBrand.name,
  description: productBrand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${googleSansFlex.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={0}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
