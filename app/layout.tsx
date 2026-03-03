import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { LayoutNav } from "@/components/layout/layout-nav";
import { getPreferredThemeAction, getNotificationsAction } from "@/app/actions/profile";
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
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [defaultTheme, notifications] = await Promise.all([
    getPreferredThemeAction(),
    getNotificationsAction(),
  ]);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider defaultTheme={defaultTheme}>
          <NotificationsProvider notifications={notifications}>
            <div className="app-layout min-h-dvh bg-background max-w-lg mx-auto relative">
              {children}
              <LayoutNav />
            </div>
          </NotificationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
