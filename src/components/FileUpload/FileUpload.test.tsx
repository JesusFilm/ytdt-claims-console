import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import FileUpload from "."

describe("FileUpload", () => {
  const mockOnDrop = vi.fn()
  const mockOnRemove = vi.fn()

  const defaultProps = {
    file: null,
    onDrop: mockOnDrop,
    title: "Test File",
    description: "Upload a test file",
  }

  beforeAll(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it("should render title and description", () => {
    render(<FileUpload {...defaultProps} />)
    expect(screen.getByText("Test File")).toBeInTheDocument()
    expect(screen.getByText("Upload a test file")).toBeInTheDocument()
  })

  it("should render upload state when no file", () => {
    render(<FileUpload {...defaultProps} />)
    expect(screen.getByText("Upload CSV file")).toBeInTheDocument()
    expect(
      screen.getByText("Drag and drop or click to browse")
    ).toBeInTheDocument()
  })

  it("should render file info when file is provided", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(<FileUpload {...defaultProps} file={file} />)
    expect(screen.getByText("test.csv")).toBeInTheDocument()
  })

  it("should call onDrop when file is dropped", async () => {
    const { container } = render(<FileUpload {...defaultProps} />)
    const input = container.querySelector('input[type="file"]')
    const file = new File(["content"], "test.csv", { type: "text/csv" })

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      await waitFor(() => {
        expect(mockOnDrop).toHaveBeenCalledWith([file])
      })
    }
  })

  it("should call onRemove when remove button is clicked", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(<FileUpload {...defaultProps} file={file} onRemove={mockOnRemove} />)

    const removeButton = screen.getByRole("button")
    fireEvent.click(removeButton)
    expect(mockOnRemove).toHaveBeenCalled()
  })

  it("should not show remove button when onRemove is not provided", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(<FileUpload {...defaultProps} file={file} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("should display file size", () => {
    const file = new File(["content"], "test.csv", { type: "text/csv" })
    render(<FileUpload {...defaultProps} file={file} />)
    expect(screen.getByText(/Bytes|KB|MB|GB/)).toBeInTheDocument()
  })

  it("should display max file size", () => {
    render(<FileUpload {...defaultProps} maxSize={1024 * 1024} />)
    expect(screen.getByText(/Maximum file size:/)).toBeInTheDocument()
  })

  it("should show disabled styles when disabled prop is true", () => {
    const { container } = render(
      <FileUpload {...defaultProps} disabled={true} />
    )
    const dropzone = container.querySelector('[role="presentation"]')
    expect(dropzone?.className).toContain("opacity-50")
    expect(dropzone?.className).toContain("cursor-not-allowed")
  })

  it("should show alert when file is rejected", async () => {
    const { container } = render(<FileUpload {...defaultProps} maxSize={1} />)
    const input = container.querySelector('input[type="file"]')
    const file = new File(["content"], "test.csv", { type: "text/csv" })

    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled()
      })
    }
  })
})
