import { render, screen, fireEvent } from "@testing-library/react"

import type { PipelineRun } from "@/types/PipelineRun"

import RunCard from "."

describe("RunCard", () => {
  const mockOnRetry = vi.fn()
  const mockOnDownload = vi.fn()
  const mockOnViewDetails = vi.fn()
  const mockOnDownloadInvalidMCIDs = vi.fn()
  const mockOnDownloadInvalidLanguageIDs = vi.fn()

  const createRun = (overrides?: Partial<PipelineRun>): PipelineRun => ({
    id: "run-1",
    startTime: new Date("2024-01-15T10:00:00"),
    status: "completed",
    duration: 60000,
    files: {},
    startedSteps: [],
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render run information", () => {
    const run = createRun()
    render(<RunCard run={run} />)
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("should display duration when available", () => {
    const run = createRun({ duration: 125000 })
    render(<RunCard run={run} />)
    expect(screen.getByText("2m 5s")).toBeInTheDocument()
  })

  it("should show running status", () => {
    const run = createRun({ status: "running" })
    render(<RunCard run={run} />)
    expect(screen.getByText("Running")).toBeInTheDocument()
    expect(screen.getByText("In progress...")).toBeInTheDocument()
  })

  it("should show failed status", () => {
    const run = createRun({ status: "failed", error: "Test error" })
    render(<RunCard run={run} />)
    expect(screen.getByText("Failed")).toBeInTheDocument()
    expect(screen.getByText("Error Details")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should call onViewDetails when view button is clicked", () => {
    const run = createRun()
    render(<RunCard run={run} onViewDetails={mockOnViewDetails} />)
    const viewButton = screen.getByTitle("View details")
    fireEvent.click(viewButton)
    expect(mockOnViewDetails).toHaveBeenCalledWith(run)
  })

  it("should show download button for completed runs", () => {
    const run = createRun({ status: "completed" })
    render(<RunCard run={run} onDownload={mockOnDownload} />)
    const downloadButton = screen.getByTitle("Download exports")
    expect(downloadButton).toBeInTheDocument()
    fireEvent.click(downloadButton)
    expect(mockOnDownload).toHaveBeenCalledWith("run-1")
  })

  it("should show retry button for failed runs", () => {
    const run = createRun({ status: "failed" })
    render(<RunCard run={run} onRetry={mockOnRetry} />)
    const retryButton = screen.getByTitle("Retry pipeline")
    expect(retryButton).toBeInTheDocument()
    fireEvent.click(retryButton)
    expect(mockOnRetry).toHaveBeenCalledWith("run-1")
  })

  it("should show retry button for timeout runs", () => {
    const run = createRun({ status: "timeout" })
    render(<RunCard run={run} onRetry={mockOnRetry} />)
    const retryButton = screen.getByTitle("Retry pipeline")
    expect(retryButton).toBeInTheDocument()
    fireEvent.click(retryButton)
    expect(mockOnRetry).toHaveBeenCalledWith("run-1")
  })

  it("should render results summary for completed runs", () => {
    const run = createRun({
      status: "completed",
      results: {
        claimsProcessed: {
          matter_entertainment: { total: 100, new: 50 },
        },
      },
    })
    render(<RunCard run={run} />)
    expect(screen.getByText("Claims")).toBeInTheDocument()
  })

  it("should pass download handlers to ResultsSummary", () => {
    const run = createRun({
      status: "completed",
      results: {
        mcnVerdicts: {
          processed: 100,
          invalidMCIDs: ["mcid1"],
          invalidLanguageIDs: [],
        },
      },
    })
    render(
      <RunCard
        run={run}
        onDownloadInvalidMCIDs={mockOnDownloadInvalidMCIDs}
        onDownloadInvalidLanguageIDs={mockOnDownloadInvalidLanguageIDs}
      />
    )
    const downloadButton = screen.getByText("invalid MCIDs")
    fireEvent.click(downloadButton)
    expect(mockOnDownloadInvalidMCIDs).toHaveBeenCalledWith("run-1", "mcn")
  })

  it("should not show download button for non-completed runs", () => {
    const run = createRun({ status: "running" })
    render(<RunCard run={run} onDownload={mockOnDownload} />)
    expect(screen.queryByTitle("Download exports")).not.toBeInTheDocument()
  })

  it("should not show retry button for completed runs", () => {
    const run = createRun({ status: "completed" })
    render(<RunCard run={run} onRetry={mockOnRetry} />)
    expect(screen.queryByTitle("Retry pipeline")).not.toBeInTheDocument()
  })

  it("should handle cancelled status", () => {
    const run = createRun({ status: "cancelled" })
    render(<RunCard run={run} />)
    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })

  it("should handle timeout status", () => {
    const run = createRun({ status: "timeout" })
    render(<RunCard run={run} />)
    expect(screen.getByText("Timeout")).toBeInTheDocument()
  })
})
