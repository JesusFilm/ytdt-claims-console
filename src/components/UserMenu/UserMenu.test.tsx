import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { AuthProvider } from "@/contexts/AuthContext"

import UserMenu from "."

vi.mock("@/utils/auth", async () => {
  const actual = await vi.importActual("@/utils/auth")
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  }
})

describe("UserMenu", () => {
  const mockUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/pic.jpg",
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(null)
  })

  it("should not render when user is null", async () => {
    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.queryByText("Test User")).not.toBeInTheDocument()
    })
  })

  it("should render user name and picture when user exists", async () => {
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
      expect(screen.getByAltText("Test User")).toBeInTheDocument()
    })
  })

  it("should toggle menu when clicked", async () => {
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
    })
    const menuTrigger = screen.getByText("Test User")
    fireEvent.click(menuTrigger)
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("Sign out")).toBeInTheDocument()
  })

  it("should close menu when backdrop is clicked", async () => {
    const { getCurrentUser } = await import("@/utils/auth")
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
    })
    const menuTrigger = screen.getByText("Test User")
    fireEvent.click(menuTrigger)
    expect(screen.getByText("Sign out")).toBeInTheDocument()

    const backdrop = document.querySelector(".fixed")
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(screen.queryByText("Sign out")).not.toBeInTheDocument()
    }
  })
})
