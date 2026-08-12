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
      <ResultsSummary results={undefined} runId="test-1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it("should render claims processed summary", () => {
    const results: PipelineRun["results"] = {
      claimsProcessed: {
        matter_entertainment: {
          total: 100,
          new: 50,
          invalidMCIDs: [],
          invalidLanguageIDs: [],
        },
        matter_2: {
          total: 200,
          new: 75,
          invalidMCIDs: [],
          invalidLanguageIDs: [],
        },
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

  it("should render shorts summary when enrichShorts is present", () => {
    const results: PipelineRun["results"] = {
      enrichShorts: { checked: 120, marked: 5 },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Shorts")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("120")).toBeInTheDocument()
  })

  it("should not render shorts card when enrichShorts is absent", () => {
    const results: PipelineRun["results"] = {
      claimsProcessed: {
        matter_entertainment: {
          total: 10,
          new: 5,
          invalidMCIDs: [],
          invalidLanguageIDs: [],
        },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.queryByText("Shorts")).not.toBeInTheDocument()
  })

  it("should render exports summary", () => {
    // The local-CSV count is derived from which stages produced output, not
    // from results.exports: one for claims, one for verdicts, one for ML.
    const results: PipelineRun["results"] = {
      claimsProcessed: {
        matter_entertainment: {
          total: 100,
          new: 50,
          invalidMCIDs: [],
          invalidLanguageIDs: [],
        },
      },
      mcnVerdicts: { processed: 10, invalidMCIDs: [], invalidLanguageIDs: [] },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("Exports")).toBeInTheDocument()
    expect(screen.getByText("2 files")).toBeInTheDocument()
  })

  it("should render issues section when there are invalid MCIDs", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [{ mcid: "mcid1" }, { mcid: "mcid2" }],
        invalidLanguageIDs: [],
      },
    }
    // The per-source breakdown only renders when a download handler is given.
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidMCIDs={mockOnDownloadMCIDs}
      />
    )
    expect(screen.getByText("Issues (2)")).toBeInTheDocument()
    expect(screen.getByText("2 invalid MCIDs")).toBeInTheDocument()
  })

  it("should render issues section when there are invalid language IDs", () => {
    const results: PipelineRun["results"] = {
      jfmVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: [
          { langId: "lang1" },
          { langId: "lang2" },
          { langId: "lang3" },
        ],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidLanguageIDs={mockOnDownloadLanguageIDs}
      />
    )
    expect(screen.getByText("Issues (3)")).toBeInTheDocument()
    expect(screen.getByText("3 invalid Lang IDs")).toBeInTheDocument()
  })

  it("should call onDownloadInvalidMCIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [{ mcid: "mcid1" }],
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
    fireEvent.click(screen.getByText("1 invalid MCIDs"))
    expect(mockOnDownloadMCIDs).toHaveBeenCalledWith("test-1", "mcn")
  })

  it("should call onDownloadInvalidLanguageIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: [{ langId: "lang1" }],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidLanguageIDs={mockOnDownloadLanguageIDs}
      />
    )
    fireEvent.click(screen.getByText("1 invalid Lang IDs"))
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
        matter_entertainment: {
          total: 100,
          new: 50,
          invalidMCIDs: [],
          invalidLanguageIDs: [],
        },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.getByText("50")).toBeInTheDocument()
    expect(screen.getByText("100")).toBeInTheDocument()
  })
})
