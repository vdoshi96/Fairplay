import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-init-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { REQUEST_NONCE_HEADER } from "@/lib/http-security";
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
    icon: [
      { url: "/icons/fairplay-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/fairplay-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF8" },
    { media: "(prefers-color-scheme: dark)", color: "#161411" }
  ],
  colorScheme: "light dark"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get(REQUEST_NONCE_HEADER) ?? undefined;

  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
