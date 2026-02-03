import type { Metadata } from "next";
import "../styles/bundle.87ba3613.css";
import "../styles/bundle.ee0b1c10.css";
import "../styles/overrides.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rogier de Boeve - Portfolio 2024",
  description: "Portfolio case study recreation with Next.js + Three.js",
  openGraph: {
    title: "Rogier de Boeve - Portfolio 2024",
    description: "Portfolio case study recreation with Next.js + Three.js",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rogier de Boeve - Portfolio 2024",
    description: "Portfolio case study recreation with Next.js + Three.js",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}