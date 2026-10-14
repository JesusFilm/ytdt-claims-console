import { fireEvent, render, screen } from "@testing-library/react"

import Screenshot from "."

describe("Screenshot", () => {
  const props = {
    src: "/help/slack-detected.jpg",
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

  it("should close on Escape", () => {
    render(<Screenshot {...props} />)
    fireEvent.click(screen.getByRole("button", { name: /open larger/i }))
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("should caption the image and say it can be enlarged", () => {
    render(<Screenshot {...props} />)
    expect(screen.getByText(/tap to enlarge/i)).toBeInTheDocument()
    expect(screen.getByAltText(props.alt)).toBeInTheDocument()
  })
})
