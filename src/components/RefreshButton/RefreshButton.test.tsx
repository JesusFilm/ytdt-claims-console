import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import RefreshButton from "."

describe("RefreshButton", () => {
  const mockOnRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render refresh button", () => {
    render(<RefreshButton onRefresh={mockOnRefresh} />)
    expect(screen.getByText("Refresh")).toBeInTheDocument()
    expect(screen.getByTitle("Refresh status")).toBeInTheDocument()
  })

  it("should call onRefresh when clicked", async () => {
    mockOnRefresh.mockResolvedValue(undefined)
    render(<RefreshButton onRefresh={mockOnRefresh} />)

    const button = screen.getByText("Refresh")
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it("should show refreshing state while refreshing", async () => {
    mockOnRefresh.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    render(<RefreshButton onRefresh={mockOnRefresh} />)

    const button = screen.getByText("Refresh")
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Refreshing...")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument()
    })
  })

  it("should be disabled when disabled prop is true", () => {
    render(<RefreshButton onRefresh={mockOnRefresh} disabled={true} />)
    const button = screen.getByText("Refresh")
    expect(button).toBeDisabled()
  })

  it("should not call onRefresh when disabled", async () => {
    render(<RefreshButton onRefresh={mockOnRefresh} disabled={true} />)
    const button = screen.getByText("Refresh")
    fireEvent.click(button)
    expect(mockOnRefresh).not.toHaveBeenCalled()
  })

  it("should handle refresh errors gracefully", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    mockOnRefresh.mockRejectedValue(new Error("Refresh failed"))

    render(<RefreshButton onRefresh={mockOnRefresh} />)
    const button = screen.getByText("Refresh")
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Refresh error:",
        expect.any(Error)
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument()
    })

    consoleError.mockRestore()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <RefreshButton onRefresh={mockOnRefresh} className="custom-class" />
    )
    const button = container.querySelector("button")
    expect(button?.className).toContain("custom-class")
  })
})
