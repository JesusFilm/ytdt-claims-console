import { render, screen, waitFor } from "@testing-library/react"

import { AuthProvider } from "@/contexts/AuthContext"

import ProtectedRoute from "."

vi.mock("@/utils/auth", async () => {
  const actual = await vi.importActual("@/utils/auth")
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    setToken: vi.fn(),
  }
})

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    window.location = { ...window.location, search: "" } as any
  })

  it("should show loading state when auth is loading", async () => {
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    )

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.getByText("Loading...")).toBeInTheDocument()
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
  })

  it("should show LoginPage when user is not authenticated", async () => {
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument()
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
    })
  })

  it("should render children when user is authenticated", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/pic.jpg",
    }
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
      expect(screen.queryByText("Sign in")).not.toBeInTheDocument()
    })
  })

  it("should render multiple children", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/pic.jpg",
    }
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Child 1</div>
          <div>Child 2</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.getByText("Child 2")).toBeInTheDocument()
    })
  })
})
