import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Magdalena Smart Farming",
  description: "Aplicación de gestión agrícola offline-first",
  manifest: "/manifest.json",
  icons: {
    icon: "/Smart_Farming_Logo.png",
    shortcut: "/Smart_Farming_Logo.png",
    apple: "/Smart_Farming_Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Magdalena SF",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/Smart_Farming_Logo.png" type="image/png" />
        <link rel="shortcut icon" href="/Smart_Farming_Logo.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/Smart_Farming_Logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Magdalena SF" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900 antialiased">
        <ClientLayout>
          {children}
          <ServiceWorkerRegistration />
        </ClientLayout>
      </body>
    </html>
  );
}
