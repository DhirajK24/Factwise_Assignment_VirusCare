import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VirusCare — Patient Quarantine & Treatment Management System",
  description: "Better Coordination. Faster Recovery. High-integrity healthcare operations SaaS with bed capacity locking, automated discharge eligibility, and epidemiological tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-[#F6F8FA] text-[#172334]">
        {children}
      </body>
    </html>
  );
}

