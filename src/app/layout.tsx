import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";
import AuthProvider from "@/context/AuthProvider";
import ToastProvider from "@/components/ToastProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses with ease",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExpTracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6C63FF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body suppressHydrationWarning>
        <ThemeRegistry>
          <AuthProvider>
            <ToastProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
              <ServiceWorkerRegister />
            </ToastProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
