import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ⚡ 1. Import ThemeProvider yang baru saja kita buat
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-brutal";
import { AccentColorInit } from "@/components/AccentColorInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiketin - War Tiket Tanpa Ribet",
  description: "Platform war tiket konser dan teater paling gila di Indonesia.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Proteksi buat tag html
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300" 
        suppressHydrationWarning // Proteksi buat tag body dari extension browser
      >
        {/* ⚡ 2. Bungkus children dengan ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system" // Akan mengikuti tema OS/HP User otomatis
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <AccentColorInit />
            {children}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(function(reg) {
                        console.log('ServiceWorker registration successful with scope: ', reg.scope);
                      }, function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      });
                    });
                  }
                `,
              }}
            />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}