import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hodnocení zaměstnanců – OŠD Praha 3",
  description: "Interní nástroj pro čtvrtletní hodnocení a návrhy odměn.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
