import { render, screen, waitFor } from "@testing-library/react"

import { AuthProvider, useAuth } from "."

vi.mock("@/utils/auth", async () => {
  const actual = await vi.importActual("@/utils/auth")
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    setToken: vi.fn(),
  }
})

const TestComponent = () => {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return <div>{user ? `User: ${user.name}` : "No user"}</div>
}

describe("AuthContext", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    delete (window as any).location
    window.location = { ...window.location, search: "" } as any
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(null)
  })

  it("should provide loading state initially", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })
  })

  it("should set token from URL params", async () => {
    const { setToken, getCurrentUser } = await import("@/utils/auth")
    window.location.search = "?token=test-token"
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith("test-token")
    })
  })

  it("should provide user when available", async () => {
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
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("User: Test User")).toBeInTheDocument()
    })
  })

  it("should throw error when useAuth is used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => {
      render(<TestComponent />)
    }).toThrow("useAuth must be used within AuthProvider")
    consoleError.mockRestore()
  })
})
