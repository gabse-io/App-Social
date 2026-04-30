import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { ClientOnly } from "@/components/client-only";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MiniBasquet Pro",
  description: "Gestión de recaudaciones de fondos para club de minibásquet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f9ff]" suppressHydrationWarning>
        <ClientOnly>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
