import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  // metadataBase est OBLIGATOIRE. Il permet à Next.js de transformer 
  // le chemin relatif "/og-image.jpg" en URL absolue (https://.../og-image.jpg)
  metadataBase: new URL(env.siteUrl),
  
  title: {
    default: "OMBRELLE Academy",
    template: "%s | OMBRELLE Academy",
  },
  description: "Apprenez la finance, l'investissement et l'entrepreneuriat digital par la pratique.",
  
  // 👇 AJOUT DU LOGO (FAVICON) ICI
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg", // Pour l'icône sur les écrans d'accueil iOS
  },

  // Balises pour WhatsApp, Facebook, LinkedIn, Discord...
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

  // Balises spécifiques pour Twitter / X
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