"use client"

import { ReactNode } from "react"

import { usePathname } from "next/navigation"

import LoginPage from "@/components/LoginPage"
import { useAuth } from "@/contexts/AuthContext"

// Pages that load without signing in. /about is the Google OAuth consent
// screen's home page, which Google requires to be publicly readable.
export const PUBLIC_PATHS = ["/about"]

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  if (pathname && PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
