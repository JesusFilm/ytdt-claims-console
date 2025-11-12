import { render, screen } from "@testing-library/react"

import GoogleDriveLinkSection from "."

describe("GoogleDriveLinkSection", () => {
  it("should not render when driveFolderUrl is not provided", () => {
    const { container } = render(<GoogleDriveLinkSection />)
    expect(container.firstChild).toBeNull()
  })

  it("should not render when driveFolderUrl is undefined", () => {
    const { container } = render(
      <GoogleDriveLinkSection driveFolderUrl={undefined} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("should render when driveFolderUrl is provided", () => {
    render(
      <GoogleDriveLinkSection driveFolderUrl="https://drive.google.com/test" />
    )
    expect(screen.getByText("Google Drive")).toBeInTheDocument()
    expect(
      screen.getByText("Exported files uploaded to shared drive")
    ).toBeInTheDocument()
  })

  it("should render link with correct href", () => {
    const url = "https://drive.google.com/test-folder"
    render(<GoogleDriveLinkSection driveFolderUrl={url} />)
    const link = screen.getByText("Open Shared Drive Folder")
    expect(link).toHaveAttribute("href", url)
  })

  it("should open link in new tab", () => {
    render(
      <GoogleDriveLinkSection driveFolderUrl="https://drive.google.com/test" />
    )
    const link = screen.getByText("Open Shared Drive Folder")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("should render with correct styling classes", () => {
    render(
      <GoogleDriveLinkSection driveFolderUrl="https://drive.google.com/test" />
    )
    const section = screen.getByText("Google Drive").closest("div")
    expect(section?.className).toContain("mb-6")
  })
})
