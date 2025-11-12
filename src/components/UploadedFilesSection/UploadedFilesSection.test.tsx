import { render, screen, fireEvent } from "@testing-library/react"

import UploadedFilesSection from "."

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3000",
  },
}))

describe("UploadedFilesSection", () => {
  beforeEach(() => {
    global.window.open = vi.fn()
  })

  it("should not render when no files", () => {
    render(<UploadedFilesSection files={{}} />)
    expect(screen.queryByText("Uploaded Files")).not.toBeInTheDocument()
  })

  it("should render when files are present", () => {
    render(
      <UploadedFilesSection
        files={{
          claims_matter_entertainment: "claims-me.csv",
        }}
      />
    )
    expect(screen.getByText("Uploaded Files")).toBeInTheDocument()
    expect(
      screen.getByText("Claims (Matter Entertainment)")
    ).toBeInTheDocument()
  })

  it("should render all file types", () => {
    render(
      <UploadedFilesSection
        files={{
          claims_matter_entertainment: "claims-me.csv",
          claims_matter_2: "claims-m2.csv",
          mcnVerdicts: "mcn-verdicts.csv",
          jfmVerdicts: "jfm-verdicts.csv",
        }}
      />
    )
    expect(
      screen.getByText("Claims (Matter Entertainment)")
    ).toBeInTheDocument()
    expect(screen.getByText("Claims (Matter 2)")).toBeInTheDocument()
    expect(screen.getByText("MCN Verdicts")).toBeInTheDocument()
    expect(screen.getByText("JFM Verdicts")).toBeInTheDocument()
  })

  it("should open download link when download button is clicked", () => {
    render(
      <UploadedFilesSection
        files={{
          claims_matter_entertainment: "claims-me.csv",
        }}
      />
    )
    const downloadButtons = screen.getAllByRole("button")
    fireEvent.click(downloadButtons[0])
    expect(window.open).toHaveBeenCalledWith(
      "http://localhost:3000/api/uploads/claims-me.csv",
      "_blank"
    )
  })
})
