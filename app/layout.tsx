import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        className="min-h-full flex flex-col" 
        suppressHydrationWarning // Proteksi buat tag body dari extension browser
      >
        {children}
      </body>
    </html>
  );
}