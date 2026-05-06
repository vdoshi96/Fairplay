import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { THEME_STORAGE_KEY } from "@/components/theme/theme-constants";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    default: "Fairplay",
    template: "%s | Fairplay"
  },
  description:
    "A calm household planning app for shared responsibilities and check-ins.",
  applicationName: "Fairplay",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fairplay"
  },
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF8" },
    { media: "(prefers-color-scheme: dark)", color: "#161411" }
  ],
  colorScheme: "light dark"
};

const themeInitScript = `
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
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themeMode = "system";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
