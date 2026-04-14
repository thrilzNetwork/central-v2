import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Central — PropTech para Agentes Inmobiliarios",
    template: "%s — Central",
  },
  description:
    "La plataforma SaaS que transforma agentes inmobiliarios bolivianos en marcas digitales. Portal propio, descripciones, y captura de leads automática.",
  keywords: ["inmobiliaria", "bolivia", "bienes raíces", "santa cruz", "agente inmobiliario"],
  openGraph: {
    siteName: "Central",
    locale: "es_BO",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@200;300;400;500;600;700&display=swap" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
