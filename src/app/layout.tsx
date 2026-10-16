import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroChain FeedTrace | Trazabilidad Agroindustrial",
  description: "Núcleo de trazabilidad verificable que vincula lotes agrícolas con lotes ganaderos on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
