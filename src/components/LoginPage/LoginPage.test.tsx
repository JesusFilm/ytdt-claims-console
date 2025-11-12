import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import LoginPage from "."

vi.mock("@/utils/auth", () => ({
  getAuthUrl: vi.fn(),
}))

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    window.location = { ...window.location, href: "" } as Location
  })

  it("should render title and description", () => {
    render(<LoginPage />)
    expect(screen.getByText("Sign in")).toBeInTheDocument()
    expect(
      screen.getByText("YouTube Claims Pipeline Console")
    ).toBeInTheDocument()
  })

  it("should render Google sign in button", () => {
    render(<LoginPage />)
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument()
  })

  it("should render restricted access message", () => {
    render(<LoginPage />)
    expect(
      screen.getByText("Restricted to authorized domains")
    ).toBeInTheDocument()
  })

  it("should call getAuthUrl and redirect on button click", async () => {
    const { getAuthUrl } = await import("@/utils/auth")
    const mockAuthUrl = "https://accounts.google.com/auth"
    vi.mocked(getAuthUrl).mockResolvedValue(mockAuthUrl)

    render(<LoginPage />)
    const button = screen.getByText("Sign in with Google")
    fireEvent.click(button)

    await waitFor(() => {
      expect(getAuthUrl).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe(mockAuthUrl)
    })
  })

  it("should show loading state when signing in", async () => {
    const { getAuthUrl } = await import("@/utils/auth")
    vi.mocked(getAuthUrl).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve("https://auth.url"), 100)
        )
    )

    render(<LoginPage />)
    const button = screen.getByText("Sign in with Google")
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument()
      expect(button).toBeDisabled()
    })
  })

  it("should handle login error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { getAuthUrl } = await import("@/utils/auth")
    vi.mocked(getAuthUrl).mockRejectedValue(new Error("Auth failed"))

    render(<LoginPage />)
    const button = screen.getByText("Sign in with Google")
    fireEvent.click(button)

    await waitFor(() => {
      expect(getAuthUrl).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledWith(
        "Login error:",
        expect.any(Error)
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Sign in with Google")).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    consoleError.mockRestore()
  })
})
