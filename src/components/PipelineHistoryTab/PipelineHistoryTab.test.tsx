import { render, screen } from "@testing-library/react"

import type { PipelineRun } from "@/types/PipelineRun"

import PipelineHistoryTab from "."

describe("PipelineHistoryTab", () => {
  const mockOnRetry = vi.fn()
  const mockOnDownload = vi.fn()

  const mockRuns: PipelineRun[] = [
    {
      id: "run-1",
      startTime: new Date("2024-01-01T10:00:00Z"),
      status: "completed",
      duration: 60000,
      files: { claims_matter_entertainment: "file1.csv" },
      startedSteps: [],
    },
    {
      id: "run-2",
      startTime: new Date("2024-01-02T10:00:00Z"),
      status: "failed",
      duration: 30000,
      files: { claims_matter_2: "file2.csv" },
      error: "Test error",
      startedSteps: [],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => "blob:url")
    global.URL.revokeObjectURL = vi.fn()
  })

  it("should render header and stats", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("Pipeline History")).toBeInTheDocument()
    expect(screen.getByText(/Track all your pipeline runs/)).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("Total runs")).toBeInTheDocument()
  })

  it("should calculate success rate correctly", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("Success rate")).toBeInTheDocument()
  })

  it("should display stats cards", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("Successful runs")).toBeInTheDocument()
    expect(screen.getByText("Failed runs")).toBeInTheDocument()
    expect(screen.getByText("Avg duration")).toBeInTheDocument()
  })

  it("should show empty state when no runs", () => {
    render(
      <PipelineHistoryTab
        runs={[]}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("No pipeline runs yet")).toBeInTheDocument()
  })

  it("should render run cards", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("should handle zero success rate", () => {
    const failedRuns: PipelineRun[] = [
      {
        id: "run-1",
        startTime: new Date(),
        status: "failed",
        files: {},
        startedSteps: [],
      },
    ]
    render(
      <PipelineHistoryTab
        runs={failedRuns}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("0%")).toBeInTheDocument()
  })
})
