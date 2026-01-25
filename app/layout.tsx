import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/auth.context";

export const metadata: Metadata = {
  title: "ElectroHogar - Sistema de Gestión",
  description: "Sistema de gestión para electrodomésticos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}