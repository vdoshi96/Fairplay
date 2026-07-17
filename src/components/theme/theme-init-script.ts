import { THEME_STORAGE_KEY } from "./theme-constants";

export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var mode = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    if (mode !== "system" && mode !== "light" && mode !== "dark") {
      mode = "system";
    }
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = mode === "dark" || (mode === "system" && prefersDark) ? "dark" : "light";
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themeMode = mode;
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themeMode = "system";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;
