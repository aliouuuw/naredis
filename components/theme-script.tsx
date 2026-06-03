/**
 * Blocking theme init — must live in a Server Component (not inside next-themes).
 * React 19 does not allow executable <script> tags from Client Components.
 * Keep in sync with ThemeProvider props in app/layout.tsx (storageKey, defaultTheme, enableSystem).
 */
export function ThemeScript() {
  const source = `
(function () {
  try {
    var storageKey = "theme";
    var defaultTheme = "light";
    var enableSystem = true;
    var theme = localStorage.getItem(storageKey) || defaultTheme;
    var root = document.documentElement;
    var isDark =
      theme === "dark" ||
      (enableSystem &&
        theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`.trim();

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}
