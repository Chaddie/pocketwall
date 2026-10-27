import type { Metadata, Viewport } from "next";
import { Inter, Lexend_Exa } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Lexend_Exa({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Pocketwall",
  description: "Mobile console for Sophos Firewall SFOS 23.",
  applicationName: "Pocketwall",
  appleWebApp: { capable: true, title: "Pocketwall", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a143a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
