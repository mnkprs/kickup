import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import { CreateMatchFab } from "@/components/create-match-fab";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kickup - Amateur Football",
  description:
    "Organize pickup games, track stats, and compete with friends. The ultimate app for amateur football.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
            {children}
            <BottomNav />
            <CreateMatchFab />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
