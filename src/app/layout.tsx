import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "OMBRELLE Academy",
    template: "%s | OMBRELLE Academy",
  },
  description: "Apprenez la finance, l'investissement et l'entrepreneuriat digital par la pratique.",
  
  // 👇 Configuration de vos nouveaux favicons
  icons: {
    icon: [
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon.png", sizes: "any", type: "image/png" },
    ],
    apple: "/icon.png",
  },

  // Open Graph (WhatsApp, Facebook, LinkedIn...)
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: env.siteUrl,
    siteName: "OMBRELLE Academy",
    title: "OMBRELLE Academy",
    description: "Apprenez la finance, l'investissement et l'entrepreneuriat digital par la pratique.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OMBRELLE Academy - Apprenez la finance",
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: "summary_large_image",
    title: "OMBRELLE Academy",
    description: "Apprenez la finance, l'investissement et l'entrepreneuriat digital par la pratique.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = { 
  width: "device-width", 
  initialScale: 1 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}