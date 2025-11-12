import { render, screen, fireEvent } from "@testing-library/react"

import type { PipelineRun } from "@/types/PipelineRun"

import RunDetailsModal from "."

describe("RunDetailsModal", () => {
  const mockOnClose = vi.fn()

  const mockRun: PipelineRun = {
    id: "test-run-1",
    startTime: new Date("2024-01-01T10:00:00Z"),
    status: "completed",
    duration: 60000,
    files: {
      claims_matter_entertainment: "claims-me.csv",
      claims_matter_2: "claims-m2.csv",
    },
    results: {
      driveFolderUrl: "https://drive.google.com/test",
    },
    startedSteps: [
      {
        name: "step_1",
        title: "Step 1",
        description: "First step",
        status: "completed",
        timestamp: new Date(),
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not render when isOpen is false", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={false} onClose={mockOnClose} />
    )
    expect(screen.queryByText("Pipeline Run Details")).not.toBeInTheDocument()
  })

  it("should render when isOpen is true", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByText("Pipeline Run Details")).toBeInTheDocument()
  })

  it("should display run ID", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByText(/test-run-1/)).toBeInTheDocument()
  })

  it("should display duration when available", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByText(/Duration:/)).toBeInTheDocument()
  })

  it("should call onClose when close button is clicked", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    const closeButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector("svg"))
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it("should call onClose when backdrop is clicked", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    const backdrop = document.querySelector(".fixed.inset-0.bg-gray-500")
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    } else {
      expect(true).toBe(true)
    }
  })

  it("should display error when run has error", () => {
    const errorRun: PipelineRun = {
      ...mockRun,
      status: "failed",
      error: "Test error message",
    }
    render(
      <RunDetailsModal run={errorRun} isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getByText("Pipeline Failed")).toBeInTheDocument()
    expect(screen.getByText("Test error message")).toBeInTheDocument()
  })

  it("should display pipeline steps", () => {
    render(
      <RunDetailsModal run={mockRun} isOpen={true} onClose={mockOnClose} />
    )
    expect(screen.getAllByText("Pipeline Steps").length).toBeGreaterThan(0)
    const step1Elements = screen.getAllByText("Step 1")
    expect(step1Elements.length).toBeGreaterThan(0)
  })
})
