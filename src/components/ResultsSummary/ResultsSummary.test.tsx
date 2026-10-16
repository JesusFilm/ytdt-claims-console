import { render, screen, fireEvent } from "@testing-library/react"

import type { PipelineRun } from "@/types/PipelineRun"

import ResultsSummary from "."

const authFetch = vi.hoisted(() => vi.fn())
vi.mock("@/utils/auth", () => ({ authFetch }))

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
        invalidMCIDs: [
          { media_component_id: "mcid1", video_id: "v1" },
          { media_component_id: "mcid2", video_id: "v2" },
        ],
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
    expect(screen.getByText("2 invalid MCIDs · 2 rows")).toBeInTheDocument()
  })

  it("should render issues section when there are invalid language IDs", () => {
    const results: PipelineRun["results"] = {
      jfmVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: [
          { language_id: "lang1", video_id: "v1" },
          { language_id: "lang2", video_id: "v2" },
          { language_id: "lang3", video_id: "v3" },
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
    expect(screen.getByText("3 invalid Lang IDs · 3 rows")).toBeInTheDocument()
  })

  it("should call onDownloadInvalidMCIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [{ media_component_id: "mcid1", video_id: "v1" }],
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
    fireEvent.click(screen.getByText("1 invalid MCIDs · 1 row"))
    expect(mockOnDownloadMCIDs).toHaveBeenCalledWith("test-1", "mcn")
  })

  it("should call onDownloadInvalidLanguageIDs when download button is clicked", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [],
        invalidLanguageIDs: [{ language_id: "lang1", video_id: "v1" }],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidLanguageIDs={mockOnDownloadLanguageIDs}
      />
    )
    fireEvent.click(screen.getByText("1 invalid Lang IDs · 1 row"))
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

  it("should count ids to fix from the rows, summary or not", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 100,
        invalidMCIDs: [
          { media_component_id: "1_jf-0-0", video_id: "v1" },
          { media_component_id: "1_jf-0-0", video_id: "v2" },
          { media_component_id: "MC99", video_id: "v3" },
        ],
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
    // Two ids to chase, not three rows to scroll.
    expect(screen.getByText("Issues (2)")).toBeInTheDocument()
    expect(screen.getByText("2 invalid MCIDs · 3 rows")).toBeInTheDocument()
  })

  it("should say 'row' once for a single affected row", () => {
    const results: PipelineRun["results"] = {
      jfmVerdicts: {
        processed: 10,
        invalidMCIDs: [],
        invalidLanguageIDs: [{ language_id: "9999", video_id: "v1" }],
      },
    }
    render(
      <ResultsSummary
        results={results}
        runId="test-1"
        onDownloadInvalidLanguageIDs={mockOnDownloadLanguageIDs}
      />
    )
    expect(screen.getByText("1 invalid Lang IDs · 1 row")).toBeInTheDocument()
  })

  it("should show the whole-table backlog, separately from this run", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 10,
        invalidMCIDs: [],
        invalidLanguageIDs: [],
        acrossAllClaims: {
          invalidMCIDs: 0,
          invalidLanguageIDs: 10106,
          files: {
            invalidMCIDs: null,
            invalidLanguageIDs: "invalid-language-ids-all-claims-mcn.csv",
          },
        },
      },
      jfmVerdicts: {
        processed: 5,
        invalidMCIDs: [],
        invalidLanguageIDs: [],
        acrossAllClaims: {
          invalidMCIDs: 12,
          invalidLanguageIDs: 0,
          files: {
            invalidMCIDs: "invalid-mcids-all-claims-jfm.csv",
            invalidLanguageIDs: null,
          },
        },
      },
    }
    render(<ResultsSummary results={results} runId="test-1" />)

    // Nothing wrong with this run's own file, but the backlog still shows.
    expect(screen.getByText("In all claims so far")).toBeInTheDocument()
    // Each list says which table and which id, so two JFM buttons are never
    // left side by side labelled only "JFM".
    expect(screen.getByText("10,106 invalid Lang IDs")).toBeInTheDocument()
    expect(screen.getByText("12 invalid MCIDs")).toBeInTheDocument()
    expect(screen.getByText("MCN Verdicts")).toBeInTheDocument()
    expect(screen.getByText("JFM Verdicts")).toBeInTheDocument()
    expect(screen.queryByText("Issues (0)")).not.toBeInTheDocument()
  })

  it("should fetch the backlog file when its button is clicked", async () => {
    authFetch.mockResolvedValue({ blob: async () => new Blob(["csv"]) })
    const results: PipelineRun["results"] = {
      mcnVerdicts: {
        processed: 10,
        invalidMCIDs: [],
        invalidLanguageIDs: [],
        acrossAllClaims: {
          invalidMCIDs: 0,
          invalidLanguageIDs: 4,
          files: {
            invalidMCIDs: null,
            invalidLanguageIDs: "invalid-language-ids-all-claims-mcn.csv",
          },
        },
      },
    }
    render(<ResultsSummary results={results} runId="run-9" />)
    fireEvent.click(screen.getByText("4 invalid Lang IDs"))
    await vi.waitFor(() =>
      expect(authFetch).toHaveBeenCalledWith(
        "/api/exports/run/run-9/invalid-language-ids-all-claims-mcn.csv"
      )
    )
  })

  it("should say nothing when there is no backlog", () => {
    const results: PipelineRun["results"] = {
      mcnVerdicts: { processed: 10, invalidMCIDs: [], invalidLanguageIDs: [] },
    }
    render(<ResultsSummary results={results} runId="test-1" />)
    expect(screen.queryByText("In all claims so far")).not.toBeInTheDocument()
  })
})
