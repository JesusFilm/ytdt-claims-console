import { render, screen, fireEvent } from "@testing-library/react"

import UploadTab from "."

describe("UploadTab", () => {
  const mockHandleFileDrop = vi.fn()
  const mockHandleFileRemove = vi.fn()
  const mockHandleRunPipeline = vi.fn()
  const mockSetScoreWithMl = vi.fn()
  const mockHandleScoreUnprocessed = vi.fn()
  const mockHandleSaveClaims = vi.fn()
  const mockHandleClearPendingRun = vi.fn()
  const mockHandleReset = vi.fn()
  const mockHandleVerdictsDrop = vi.fn()
  const mockHandleVerdictAssign = vi.fn()
  const mockHandleVerdictRemove = vi.fn()

  const defaultProps = {
    files: {
      claimsME: null,
      claimsM2: null,
      mcnVerdicts: null,
      jfmVerdicts: null,
    },
    isRunning: false,
    loading: false,
    pendingRun: null,
    handleFileDrop: mockHandleFileDrop,
    handleFileRemove: mockHandleFileRemove,
    handleRunPipeline: mockHandleRunPipeline,
    verdicts: [],
    classifying: false,
    handleVerdictsDrop: mockHandleVerdictsDrop,
    handleVerdictAssign: mockHandleVerdictAssign,
    handleVerdictRemove: mockHandleVerdictRemove,
    scoreWithMl: true,
    setScoreWithMl: mockSetScoreWithMl,
    handleScoreUnprocessed: mockHandleScoreUnprocessed,
    handleSaveClaims: mockHandleSaveClaims,
    handleClearPendingRun: mockHandleClearPendingRun,
    handleReset: mockHandleReset,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should let the user turn scoring off once a file is chosen", () => {
    const file = new File(["a"], "claims.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
      />
    )

    const checkbox = screen.getByRole("checkbox", {
      name: /Score claims with YT-Validator/,
    })
    expect(checkbox).toBeChecked()
    fireEvent.click(checkbox)
    expect(mockSetScoreWithMl).toHaveBeenCalledWith(false)
  })

  it("should not offer the scoring choice before a file is chosen", () => {
    render(<UploadTab {...defaultProps} />)
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("should render title and description", () => {
    render(<UploadTab {...defaultProps} />)
    expect(screen.getByText("Process YouTube MCN Claims")).toBeInTheDocument()
    expect(
      screen.getByText(/Upload your claims reports and verdict files/)
    ).toBeInTheDocument()
  })

  it("should render all file upload sections", () => {
    render(<UploadTab {...defaultProps} />)
    expect(screen.getByText("Upload claims manually")).toBeInTheDocument()
    expect(screen.getByText("Verdicts")).toBeInTheDocument()
    expect(screen.getByText("Matter Entertainment")).toBeInTheDocument()
    expect(screen.getByText("Matter 2")).toBeInTheDocument()
    expect(screen.getByText("Drop the verdicts CSV")).toBeInTheDocument()
  })

  it("should place a classified file without asking which it is", () => {
    const file = new File(["a"], "verdicts.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, mcnVerdicts: file }}
        verdicts={[
          {
            file,
            side: "mcn",
            problem: null,
            rows: 45495,
            ratio: 0.04,
            manual: false,
          },
        ]}
      />
    )

    expect(screen.getByText("verdicts.csv")).toBeInTheDocument()
    expect(
      screen.getByText(
        /MCN verdicts · 45,495 rows · 4% of these videos are ours/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Run Pipeline/ })
    ).not.toBeDisabled()
  })

  // A file left unplaced would be dropped from the run without a word
  it("should hold Run back while a file has no box", () => {
    const file = new File(["a"], "mystery.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
        verdicts={[
          {
            file,
            side: null,
            problem: "MCN or JFM is unclear — 48% of these videos are ours.",
            rows: 600,
            ratio: 0.48,
            manual: false,
          },
        ]}
      />
    )

    expect(screen.getByText(/48% of these videos are ours/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Run Pipeline/ })).toBeDisabled()

    fireEvent.change(
      screen.getByRole("combobox", { name: /Which verdicts is mystery.csv/ }),
      { target: { value: "jfm" } }
    )
    expect(mockHandleVerdictAssign).toHaveBeenCalledWith("mystery.csv", "jfm")
  })

  it("should render action buttons", () => {
    render(<UploadTab {...defaultProps} />)
    expect(screen.getByText("Reset Files")).toBeInTheDocument()
    expect(screen.getByText("Run Pipeline")).toBeInTheDocument()
  })

  it("should disable buttons when running", () => {
    render(<UploadTab {...defaultProps} isRunning={true} />)
    const resetButton = screen.getByText("Reset Files")
    const runButton = screen.getByText("Pipeline Running")
    expect(resetButton).toBeDisabled()
    expect(runButton).toBeDisabled()
  })

  it("should disable run button when no files are uploaded", () => {
    render(<UploadTab {...defaultProps} />)
    const runButton = screen.getByText("Run Pipeline")
    expect(runButton).toBeDisabled()
  })

  it("should offer scoring unprocessed claims when no files are uploaded", () => {
    render(<UploadTab {...defaultProps} />)
    const scoreButton = screen.getByText("Score Unprocessed Claims")
    expect(scoreButton).toBeInTheDocument()
    expect(scoreButton).not.toBeDisabled()
  })

  it("should call handleScoreUnprocessed when score button is clicked", () => {
    render(<UploadTab {...defaultProps} />)
    fireEvent.click(screen.getByText("Score Unprocessed Claims"))
    expect(mockHandleScoreUnprocessed).toHaveBeenCalledTimes(1)
  })

  it("should hide score button once files are uploaded", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
      />
    )
    expect(
      screen.queryByText("Score Unprocessed Claims")
    ).not.toBeInTheDocument()
  })

  it("should disable score button while a pipeline is running", () => {
    render(<UploadTab {...defaultProps} isRunning={true} />)
    expect(screen.getByText("Score Unprocessed Claims")).toBeDisabled()
  })

  it("should enable run button when files are uploaded", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
      />
    )
    const runButton = screen.getByText("Run Pipeline")
    expect(runButton).not.toBeDisabled()
  })

  it("should call handleRunPipeline when run button is clicked", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
      />
    )
    const runButton = screen.getByText("Run Pipeline")
    fireEvent.click(runButton)
    expect(mockHandleRunPipeline).toHaveBeenCalledTimes(1)
  })

  it("should call handleReset when reset button is clicked", () => {
    render(<UploadTab {...defaultProps} />)
    const resetButton = screen.getByText("Reset Files")
    fireEvent.click(resetButton)
    expect(mockHandleReset).toHaveBeenCalledTimes(1)
  })

  it("should show loading state", () => {
    render(<UploadTab {...defaultProps} loading={true} />)
    expect(screen.getByText("Starting Pipeline...")).toBeInTheDocument()
  })

  it("should show file summary when files are uploaded", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(
      <UploadTab
        {...defaultProps}
        files={{ ...defaultProps.files, claimsME: file }}
      />
    )
    expect(screen.getByText("Ready to Process")).toBeInTheDocument()
  })

  it("should not show file summary when no files are uploaded", () => {
    render(<UploadTab {...defaultProps} />)
    expect(screen.queryByText("Ready to Process")).not.toBeInTheDocument()
  })

  it("should lead with verdicts and tuck claims away", () => {
    // claims arrive on their own; the big first-in-reading-order claims boxes
    // are what led to verdict files being dropped into them
    const { container } = render(<UploadTab {...defaultProps} />)

    const summary = screen.getByText("Upload claims manually")
    expect(summary.closest("details")).not.toBeNull()
    expect(summary.closest("details")!.hasAttribute("open")).toBe(false)

    const html = container.innerHTML
    expect(html.indexOf("Verdicts")).toBeLessThan(
      html.indexOf("Upload claims manually")
    )
  })
})
