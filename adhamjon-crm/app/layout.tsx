import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Bepul marketing tahlili — Marketolog Adhamjon",
  description: "Ariza qoldiring — 24 soat ichida menejer bog'lanadi. Instagram uchun bepul marketing tahlili.",
  openGraph: {
    title: "Bepul marketing tahlili — Marketolog Adhamjon",
    description: "Ariza qoldiring — 24 soat ichida menejer bog'lanadi.",
    type: "website",
    locale: "uz_UZ",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="dark">
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
