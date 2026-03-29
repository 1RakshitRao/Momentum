import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";

export const metadata: Metadata = {
  title: "Momentum",
  description: "Your calm companion for getting started",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;700&family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-[#0a0a0f] text-on-surface">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
