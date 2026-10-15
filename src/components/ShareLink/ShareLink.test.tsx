import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import ShareLink from "."

describe("ShareLink", () => {
  const writeText = vi.fn()

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it("should copy a link that opens the console on that entry", async () => {
    render(<ShareLink id="6ace77468826f6cdf159ef4a" />)
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }))

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/?run=6ace77468826f6cdf159ef4a`
      )
    )
  })

  it("should confirm the copy, then go back to offering it", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] })
    try {
      render(<ShareLink id="abc" />)
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }))
      await vi.waitFor(() =>
        expect(
          screen.getByRole("button", { name: /link copied/i })
        ).toBeInTheDocument()
      )
      vi.advanceTimersByTime(2100)
      await vi.waitFor(() =>
        expect(
          screen.getByRole("button", { name: /copy link/i })
        ).toBeInTheDocument()
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it("should show the address when the clipboard is refused", async () => {
    // an insecure origin or a denied permission must not fail silently
    writeText.mockRejectedValue(new Error("denied"))
    const prompt = vi.spyOn(window, "prompt").mockReturnValue(null)
    render(<ShareLink id="abc" />)
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }))

    await waitFor(() =>
      expect(prompt).toHaveBeenCalledWith(
        "Copy this link",
        `${window.location.origin}/?run=abc`
      )
    )
    prompt.mockRestore()
  })
})
