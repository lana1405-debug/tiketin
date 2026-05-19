import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ⚡ 1. Import ThemeProvider yang baru saja kita buat
import { ThemeProvider } from "@/components/theme-provider";

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
        // ⚡ Tambahkan bg-white dan dark:bg-slate-900 agar background utama ikut berubah
        className="min-h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300" 
        suppressHydrationWarning // Proteksi buat tag body dari extension browser
      >
        {/* ⚡ 2. Bungkus children dengan ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system" // Akan mengikuti tema OS/HP User otomatis
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}