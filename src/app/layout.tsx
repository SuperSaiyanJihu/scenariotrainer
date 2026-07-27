import type { Metadata, Viewport } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "ScenarioTrainer",
  description: "Practice role-play conversations with AI coaching",
  applicationName: "ScenarioTrainer",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScenarioTrainer",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#5b3fdb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lexend.variable} font-sans antialiased`}>
        {children}
        <ServiceWorkerRegister />
        <InstallAppPrompt />
      </body>
    </html>
  );
}
