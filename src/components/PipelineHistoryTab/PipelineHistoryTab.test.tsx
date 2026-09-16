import { fireEvent, render, screen } from "@testing-library/react"

import type { ClaimsIngestSummary } from "@/types/ClaimsIngest"
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
    // jsdom has no layout, so nothing implements this
    Element.prototype.scrollIntoView = vi.fn()
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
    expect(
      screen.getByText(/Pipeline runs and daily claims collection/)
    ).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("Entries")).toBeInTheDocument()
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
    expect(screen.getByText("Run success")).toBeInTheDocument()
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
    expect(screen.getByText("Median full run")).toBeInTheDocument()
  })

  it("should show empty state when no runs", () => {
    render(
      <PipelineHistoryTab
        runs={[]}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument()
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

  const mockIngests: ClaimsIngestSummary[] = [
    {
      id: "ingest-1",
      kind: "ingest",
      status: "completed",
      trigger: "schedule",
      startTime: "2024-01-03T06:00:00Z",
      endTime: "2024-01-03T06:09:41Z",
      reports: {
        matter_2: {
          contentOwnerId: "M2",
          reportId: "176",
          startTime: "2024-01-01T07:00:00Z",
          createTime: "2024-01-02T20:31:00Z",
        },
      },
      results: {
        claimsProcessed: { matter_2: { total: 212845, new: 521 } },
        asrQueue: { rows: 4429 },
        enrichShorts: { checked: 8, marked: 5 },
      },
    },
    {
      id: "ingest-2",
      kind: "ingest",
      status: "nothing_new",
      startTime: "2024-01-02T06:00:00Z",
    },
  ]

  it("should show claims ingests alongside pipeline runs", () => {
    render(<PipelineHistoryTab runs={mockRuns} ingests={mockIngests} />)

    expect(screen.getAllByText("Claims ingest")).toHaveLength(2)
    expect(screen.getByText("Collected")).toBeInTheDocument()
    // the common case is not a failure
    expect(screen.getByText("No new snapshot")).toBeInTheDocument()
    expect(screen.getByText(/Snapshot 2024-01-01/)).toBeInTheDocument()
    expect(screen.getByText("521")).toBeInTheDocument()
  })

  it("should order ingests and runs together, newest first", () => {
    // run-1 Jan 1, run-2 Jan 2 10:00, ingest-2 Jan 2 06:00, ingest-1 Jan 3
    render(<PipelineHistoryTab runs={mockRuns} ingests={mockIngests} />)

    const order = Array.from(document.querySelectorAll("[data-entry]")).map(
      (el) => el.getAttribute("data-entry")
    )
    expect(order).toEqual([
      "ingest-ingest-1",
      "pipeline-run-2",
      "ingest-ingest-2",
      "pipeline-run-1",
    ])
  })

  it("should filter to one kind at a time", () => {
    render(<PipelineHistoryTab runs={mockRuns} ingests={mockIngests} />)

    fireEvent.click(screen.getByText(`Claims ingests (${mockIngests.length})`))
    expect(screen.getAllByText("Claims ingest")).toHaveLength(2)
    expect(screen.queryByText("Retry")).not.toBeInTheDocument()

    fireEvent.click(screen.getByText(`Pipeline runs (${mockRuns.length})`))
    expect(screen.queryByText("Claims ingest")).not.toBeInTheDocument()
  })

  it("should prefer the server's per-mode median over mixing run types", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        stats={{
          total: 2,
          successful: 1,
          failed: 1,
          ingests: { total: 0, completed: 0, nothingNew: 0, failed: 0 },
          medianDuration: { full: 892000, scoring: 196000, partial: null },
        }}
      />
    )
    // 892000ms formatted, not a bare "14:52" that could be read as seconds
    expect(screen.getByText("14m 52s")).toBeInTheDocument()
  })

  it("should page back through older entries", () => {
    const onLoadMore = vi.fn()
    render(
      <PipelineHistoryTab runs={mockRuns} hasMore onLoadMore={onLoadMore} />
    )

    fireEvent.click(screen.getByText("Load older"))
    expect(onLoadMore).toHaveBeenCalled()
  })

  it("should not offer to load older entries when there are none", () => {
    render(<PipelineHistoryTab runs={mockRuns} />)
    expect(screen.queryByText("Load older")).not.toBeInTheDocument()
  })

  it("should single out the entry it was sent to, run or ingest", () => {
    const { rerender } = render(
      <PipelineHistoryTab
        runs={mockRuns}
        ingests={mockIngests}
        highlightId="ingest-1"
      />
    )
    expect(
      screen.getByText(/Snapshot 2024-01-01/).closest(".ring-2")
    ).not.toBeNull()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()

    rerender(
      <PipelineHistoryTab
        runs={mockRuns}
        ingests={mockIngests}
        highlightId="run-1"
      />
    )
    expect(
      screen.getByText(/Snapshot 2024-01-01/).closest(".ring-2")
    ).toBeNull()
    // RunCard's DOM id is what a shared ?run= link points at
    expect(document.getElementById("run-run-1")?.className).toContain("ring-2")
  })

  it("should leave the list alone when the entry is not loaded", () => {
    render(
      <PipelineHistoryTab
        runs={mockRuns}
        ingests={mockIngests}
        highlightId="run-older-than-this-page"
      />
    )
    expect(document.querySelector(".ring-2")).toBeNull()
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it("should widen a filter that would hide the highlighted entry", () => {
    const { rerender } = render(
      <PipelineHistoryTab runs={mockRuns} ingests={mockIngests} />
    )

    fireEvent.click(screen.getByText(`Pipeline runs (${mockRuns.length})`))
    expect(screen.queryByText("Claims ingest")).not.toBeInTheDocument()

    // Sent to an ingest while the list shows runs only: without this the tab
    // switches to a list that looks unchanged, which reads as a dead link.
    rerender(
      <PipelineHistoryTab
        runs={mockRuns}
        ingests={mockIngests}
        highlightId="ingest-1"
      />
    )
    expect(screen.getAllByText("Claims ingest")).toHaveLength(2)
    expect(
      screen.getByText(/Snapshot 2024-01-01/).closest(".ring-2")
    ).not.toBeNull()
  })
})
