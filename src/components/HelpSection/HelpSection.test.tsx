import { fireEvent, render, screen } from "@testing-library/react"

import HelpSection from "."

describe("HelpSection", () => {
  const renderSection = () =>
    render(
      <HelpSection title="Collection" anchors={["claims-as-of", "new-claims"]}>
        <p id="claims-as-of">The day the data covers.</p>
      </HelpSection>
    )

  beforeEach(() => {
    window.location.hash = ""
  })

  it("should start closed, so the page is a list of questions", () => {
    // eighteen terms open at once is a wall of text for one question
    const { container } = renderSection()
    expect(container.querySelector("details")?.open).toBe(false)
    expect(screen.getByText("Collection")).toBeInTheDocument()
  })

  it("should open when a label links straight to one of its terms", () => {
    window.location.hash = "#claims-as-of"
    const { container } = renderSection()
    expect(container.querySelector("details")?.open).toBe(true)
  })

  it("should stay closed for an anchor it does not hold", () => {
    window.location.hash = "#audio-language"
    const { container } = renderSection()
    expect(container.querySelector("details")?.open).toBe(false)
  })

  it("should open on a later hash change, not just on load", () => {
    const { container } = renderSection()
    window.location.hash = "#new-claims"
    fireEvent(window, new HashChangeEvent("hashchange"))
    expect(container.querySelector("details")?.open).toBe(true)
  })
})
