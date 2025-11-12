import { render, screen, fireEvent } from "@testing-library/react"

import UploadTab from "."

describe("UploadTab", () => {
  const mockHandleFileDrop = vi.fn()
  const mockHandleFileRemove = vi.fn()
  const mockHandleRunPipeline = vi.fn()
  const mockHandleReset = vi.fn()

  const defaultProps = {
    files: {
      claimsME: null,
      claimsM2: null,
      mcnVerdicts: null,
      jfmVerdicts: null,
    },
    isRunning: false,
    loading: false,
    handleFileDrop: mockHandleFileDrop,
    handleFileRemove: mockHandleFileRemove,
    handleRunPipeline: mockHandleRunPipeline,
    handleReset: mockHandleReset,
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(screen.getByText("Claims Files")).toBeInTheDocument()
    expect(screen.getByText("Verdicts")).toBeInTheDocument()
    expect(screen.getByText("Matter Entertainment")).toBeInTheDocument()
    expect(screen.getByText("Matter 2")).toBeInTheDocument()
    expect(screen.getByText("MCN Verdicts")).toBeInTheDocument()
    expect(screen.getByText("JFM Verdicts")).toBeInTheDocument()
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
})
