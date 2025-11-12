import { env } from "@/env"

export async function getAuthUrl(): Promise<string> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/google`)
  const data = await res.json()
  return data.authUrl
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token)
}

export function removeToken(): void {
  localStorage.removeItem("auth_token")
}

export async function getCurrentUser() {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      removeToken()
      return null
    }

    return await res.json()
  } catch {
    removeToken()
    return null
  }
}

export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  removeToken()
  window.location.href = "/"
}

export async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  return fetch(`${env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
}
