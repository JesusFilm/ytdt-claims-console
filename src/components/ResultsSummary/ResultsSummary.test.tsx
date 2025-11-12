import { render, screen, fireEvent } from "@testing-library/react"

import type { PipelineRun } from "@/types/PipelineRun"

import ResultsSummary from "."

describe("ResultsSummary", () => {
  const mockOnDownloadMCIDs = vi.fn()
  const mockOnDownloadLanguageIDs = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return null when results are not provided", () => {
    const { container } = render(
      <ResultsSummary results={null} runId="test-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it("should render claims processed summary", () => {
    const results: PipelineRun["results"] = {
      claimsProcessed: {
        matter_entertainment: { total: 100, new: 50 },
        matter_2: { total: 200, new: 75 },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Claims")).toBeInTheDocument()
    expect(screen.getByText("125")).toBeInTheDocument()
    expect(screen.getByText("300")).toBeInTheDocument()
  })

  it("should render verdicts processed summary", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: { processed: 150, invalidMCIDs: [], invalidLanguageIDs: [] },
      jfmVerdicts: { processed: 250, invalidMCIDs: [], invalidLanguageIDs: [] },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Verdicts")).toBeInTheDocument()
    expect(screen.getByText("400")).toBeInTheDocument()
  })

  it("should render exports summary", () => {
    const results: PipelineRun["results"] = {
      exports: {
        file1: { rows: 100, path: "/path1" },
        file2: { rows: 200, path: "/path2" },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Exports")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should render issues section when there are invalid MCIDs", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: ["mcid1", "mcid2"],
        invalidLanguageIDs: [],
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Issues")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("2 MCIDs")).toBeInTheDocument()
  })

  it("should render issues section when there are invalid language IDs", () => {
    const results: PipelineRun["results"] = {
      jfmVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: ["lang1", "lang2", "lang3"],
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Issues")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("3 Lang IDs")).toBeInTheDocument()
  })

  it("should call onDownloadInvalidMCIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: ["mcid1"],
        invalidLanguageIDs: [],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidMCIDs={mockOnDownloadMCIDs}
      />
    )
    const button = screen.getByText("invalid MCIDs")
    fireEvent.click(button)
    expect(mockOnDownloadMCIDs).toHaveBeenCalledWith("test-1", "mcn")
  })

  it("should call onDownloadInvalidLanguageIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: ["lang1"],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidLanguageIDs={mockOnDownloadLanguageIDs}
      />
    )
    const button = screen.getByText("invalid Lang IDs")
    fireEvent.click(button)
    expect(mockOnDownloadLanguageIDs).toHaveBeenCalledWith("test-1", "mcn")
  })

  it("should not show issues section when there are no issues", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: [],
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.queryByText("Issues")).not.toBeInTheDocument()
  })

  it("should handle partial claims data", () => {
    const results: PipelineRun["results"] = {
      claimsProcessed: {
        matter_entertainment: { total: 100, new: 50 },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("50")).toBeInTheDocument()
    expect(screen.getByText("100")).toBeInTheDocument()
  })
})
