/**
 * @file layout.tsx
 * @description Root App Router layout that mounts the Inter font, global navbar/footer, Sonner toaster and applies the base background/foreground theme.
 * @author Carlos Mejía
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MiPIT PoC',
  description: 'Simulation & Inspection UI for cross-border payments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* P11 — Mount Sonner Toaster (was missing; sonner.toast calls from
            4 pages silently disappeared, making error UX invisible). */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
