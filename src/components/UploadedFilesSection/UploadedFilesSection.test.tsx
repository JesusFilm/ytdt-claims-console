import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { authFetch } from "@/utils/auth"

import UploadedFilesSection from "."

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3000",
  },
}))

vi.mock("@/utils/auth", () => ({
  authFetch: vi.fn(),
}))

describe("UploadedFilesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authFetch).mockResolvedValue({
      blob: async () => new Blob(["csv"], { type: "text/csv" }),
    } as unknown as Response)
    global.URL.createObjectURL = vi.fn(() => "blob:mock")
    global.URL.revokeObjectURL = vi.fn()
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

  it("should fetch the file through authFetch when download is clicked", async () => {
    // Downloads go through authFetch and a blob, not window.open, so the
    // request carries the auth token.
    render(
      <UploadedFilesSection
        files={{
          claims_matter_entertainment: "claims-me.csv",
        }}
      />
    )
    fireEvent.click(screen.getAllByRole("button")[0])
    await waitFor(() =>
      expect(authFetch).toHaveBeenCalledWith("/api/uploads/claims-me.csv")
    )
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
  })
})
