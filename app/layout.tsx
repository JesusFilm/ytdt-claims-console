import { ReactNode } from "react"

import { Inter } from "next/font/google"

import { DatadogRUM } from "@/components/DatadogRUM"
import ProtectedRoute from "@/components/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"

import type { Metadata, Viewport } from "next"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

// Relative image paths in the metadata below are resolved against this, so
// without it Slack would be sent a localhost URL for the thumbnail.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://ytdt-claims-console.jesusfilm.org"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "YouTube MCN Pipeline Dashboard",
  description:
    "Multi-Channel Network claims processing and management dashboard",
  keywords: ["youtube", "mcn", "claims", "pipeline", "dashboard"],
  authors: [{ name: "Jesus Film Project" }],
  robots: "noindex, nofollow", // Remove for production
  // Without an image Slack still lays out a preview card and leaves a grey
  // box where the thumbnail would go, which is what a shared run link looks
  // like in the channel. The logo is small but it is ours.
  openGraph: {
    type: "website",
    siteName: "YTDT Claims Console",
    title: "YouTube MCN Pipeline Dashboard",
    description:
      "Multi-Channel Network claims processing and management dashboard",
    images: [
      { url: "/logo.png", width: 88, height: 88, alt: "Jesus Film Project" },
    ],
  },
  twitter: {
    card: "summary",
    title: "YouTube MCN Pipeline Dashboard",
    description:
      "Multi-Channel Network claims processing and management dashboard",
    images: ["/logo.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B82F6",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${inter.className} antialiased bg-gray-50 text-gray-900`}
      >
        <DatadogRUM />
        <AuthProvider>
          <ProtectedRoute>
            <div id="root" className="min-h-screen">
              {children}
            </div>
          </ProtectedRoute>
        </AuthProvider>

        {/* Portal container for modals/overlays */}
        <div id="portal-root" />
      </body>
    </html>
  )
}
