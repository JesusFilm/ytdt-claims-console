import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import ProcessedFilesSection from "."

vi.mock("@/utils/auth", () => ({
  authFetch: vi.fn(),
}))

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3000",
  },
}))

describe("ProcessedFilesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => "blob:url")
    global.URL.revokeObjectURL = vi.fn()
  })

  it("should show loading state initially", async () => {
    const { authFetch } = await import("@/utils/auth")
    vi.mocked(authFetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ json: async () => ({ files: [] }) } as any),
            100
          )
        )
    )

    render(<ProcessedFilesSection runId="test-run-1" />)
    expect(screen.getByText("Loading exported files...")).toBeInTheDocument()
  })

  it("should show empty state when no files", async () => {
    const { authFetch } = await import("@/utils/auth")
    vi.mocked(authFetch).mockResolvedValue({
      json: async () => ({ files: [] }),
    } as Response)

    render(<ProcessedFilesSection runId="test-run-1" />)

    await waitFor(() => {
      expect(screen.getByText("No exported files found")).toBeInTheDocument()
    })
  })

  it("should display exported files", async () => {
    const { authFetch } = await import("@/utils/auth")
    const mockFiles = [
      {
        name: "export1.csv",
        size: 1024,
        modified: "2024-01-01T10:00:00Z",
      },
      {
        name: "export2.csv",
        size: 2048,
        modified: "2024-01-02T10:00:00Z",
      },
    ]
    vi.mocked(authFetch).mockResolvedValue({
      json: async () => ({ files: mockFiles }),
    } as Response)

    render(<ProcessedFilesSection runId="test-run-1" />)

    await waitFor(() => {
      expect(screen.getByText("export1.csv")).toBeInTheDocument()
      expect(screen.getByText("export2.csv")).toBeInTheDocument()
    })
  })

  it("should display file size and modified date", async () => {
    const { authFetch } = await import("@/utils/auth")
    const mockFiles = [
      {
        name: "export1.csv",
        size: 1024,
        modified: "2024-01-01T10:00:00Z",
      },
    ]
    vi.mocked(authFetch).mockResolvedValue({
      json: async () => ({ files: mockFiles }),
    } as Response)

    render(<ProcessedFilesSection runId="test-run-1" />)

    await waitFor(() => {
      expect(screen.getByText(/1.0 KB/)).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })

  it("should create download link when download button is clicked", async () => {
    const { authFetch } = await import("@/utils/auth")
    const mockFiles = [
      {
        name: "export1.csv",
        size: 1024,
        modified: "2024-01-01T10:00:00Z",
      },
    ]
    vi.mocked(authFetch).mockResolvedValue({
      json: async () => ({ files: mockFiles }),
    } as Response)

    const createElementSpy = vi.spyOn(document, "createElement")
    const appendChildSpy = vi.spyOn(document.body, "appendChild")
    const removeChildSpy = vi.spyOn(document.body, "removeChild")

    render(<ProcessedFilesSection runId="test-run-1" />)

    await waitFor(() => {
      expect(screen.getByText("export1.csv")).toBeInTheDocument()
    })

    const downloadButton = screen.getAllByRole("button")[0]
    fireEvent.click(downloadButton)

    expect(createElementSpy).toHaveBeenCalledWith("a")
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it("should handle fetch error gracefully", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { authFetch } = await import("@/utils/auth")
    vi.mocked(authFetch).mockRejectedValue(new Error("Fetch failed"))

    render(<ProcessedFilesSection runId="test-run-1" />)

    await waitFor(() => {
      expect(screen.getByText("No exported files found")).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to fetch exported files:",
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })

  it("should fetch files for correct runId", async () => {
    const { authFetch } = await import("@/utils/auth")
    vi.mocked(authFetch).mockResolvedValue({
      json: async () => ({ files: [] }),
    } as Response)

    render(<ProcessedFilesSection runId="test-run-123" />)

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith("/api/exports/run/test-run-123")
    })
  })
})
