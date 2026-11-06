import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { sfPro } from "@/fonts/sfPro";

export const metadata: Metadata = {
  title: "Aether Clinic | Medical Platform",
  description: "Next-generation precision healthcare management and practitioner coordination",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${sfPro.variable} ${sfPro.className}`} suppressHydrationWarning>
      <body className={`${sfPro.className} min-h-screen font-sans selection:bg-brand/20 selection:text-brand-700 antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
