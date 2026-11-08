import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Ariza qoldiring — ${BRAND.name}`,
  description: "Ariza qoldiring — menejerimiz tez orada bog'lanadi.",
  openGraph: {
    title: `Ariza qoldiring — ${BRAND.name}`,
    description: BRAND.tagline,
    type: "website",
    locale: "uz_UZ",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E5A4D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
