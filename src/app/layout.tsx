import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
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
  themeColor: "#FFFDF8",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
