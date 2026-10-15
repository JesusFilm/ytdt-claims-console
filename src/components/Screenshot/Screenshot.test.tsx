import { fireEvent, render, screen } from "@testing-library/react"

import Screenshot from "."

describe("Screenshot", () => {
  const props = {
    src: "/help/slack-detected.png",
    alt: "The bot naming each file",
    width: 620,
    height: 160,
  }

  it("should open the image over the page and close again", () => {
    // help images are cropped small, so on a phone they need enlarging
    render(<Screenshot {...props} />)
    expect(screen.queryByRole("dialog")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /open larger/i }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeInTheDocument()

    fireEvent.click(dialog)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("should draw at half the captured size, never stretched", () => {
    // a 1x grab stretched across the column is why the text looked soft
    render(<Screenshot {...props} />)
    const button = screen.getByRole("button", { name: /open larger/i })
    // captured at 620 wide; drawn at half, so retina has pixels to spare
    expect(button.style.maxWidth).toBe("310px")
  })

  it("should close on Escape", () => {
    render(<Screenshot {...props} />)
    fireEvent.click(screen.getByRole("button", { name: /open larger/i }))
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("should caption the image and say it can be enlarged", () => {
    render(<Screenshot {...props} />)
    expect(screen.getByText(/click to enlarge/i)).toBeInTheDocument()
    expect(screen.getByAltText(props.alt)).toBeInTheDocument()
  })
})
