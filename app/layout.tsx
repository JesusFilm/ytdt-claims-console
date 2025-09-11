import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "YouTube MCN Pipeline Dashboard",
  description: "Multi-Channel Network claims processing and management dashboard",
  keywords: ["youtube", "mcn", "claims", "pipeline", "dashboard"],
  authors: [{ name: "Jesus Film Project" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3B82F6",
  robots: "noindex, nofollow", // Remove for production
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <div id="root" className="min-h-screen">
          {children}
        </div>
        
        {/* Portal container for modals/overlays */}
        <div id="portal-root" />
      </body>
    </html>
  );
}