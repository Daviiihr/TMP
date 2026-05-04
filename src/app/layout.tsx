import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TMP — Tournament Manager Pro | Domina la Arena",
  description:
    "Plataforma profesional de gestión de torneos de videojuegos. Brackets inteligentes, ranking dinámico, inscripción transaccional y premios en efectivo. Únete a la competición.",
  keywords: [
    "esports",
    "torneos",
    "gaming",
    "brackets",
    "ranking",
    "competición",
    "premios",
  ],
  openGraph: {
    title: "TMP — Tournament Manager Pro",
    description:
      "La plataforma definitiva para gestión de torneos de e-sports profesionales.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
