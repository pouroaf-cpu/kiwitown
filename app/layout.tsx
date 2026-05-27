import type { Metadata, Viewport } from "next";
import { DM_Sans, Barlow_Condensed, Satisfy } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["600", "700", "800"],
  display: "swap",
});

const satisfy = Satisfy({
  subsets: ["latin"],
  variable: "--font-satisfy",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiwitown KPI | Kiwitown Electrical",
  description: "Crew KPI and weekly performance tracking for Kiwitown Electrical",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kiwitown KPI",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#00AEEF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${barlowCondensed.variable} ${satisfy.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="font-sans bg-bg text-text-primary antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
