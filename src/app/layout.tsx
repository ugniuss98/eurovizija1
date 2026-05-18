import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sąskaitos - Invoice Management",
  description: "Lithuanian invoice management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
