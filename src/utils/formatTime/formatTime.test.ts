import { formatDuration, formatTimestamp } from "."

describe("formatTime", () => {
  describe("formatDuration", () => {
    it("should return infinity emoji for undefined", () => {
      expect(formatDuration(undefined)).toBe("♾️")
    })

    it("should format seconds", () => {
      expect(formatDuration(5000)).toBe("5s")
      expect(formatDuration(30000)).toBe("30s")
    })

    it("should format minutes and seconds", () => {
      expect(formatDuration(60000)).toBe("1m 0s")
      expect(formatDuration(125000)).toBe("2m 5s")
      expect(formatDuration(3665000)).toBe("61m 5s")
    })

    it("should handle milliseconds correctly", () => {
      expect(formatDuration(1000)).toBe("1s")
      expect(formatDuration(999)).toBe("0s")
      expect(formatDuration(59999)).toBe("59s")
    })
  })

  describe("formatTimestamp", () => {
    it("should format Date object", () => {
      const date = new Date("2024-01-15T14:30:00")
      const formatted = formatTimestamp(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
      expect(formatted).toMatch(/2:30 PM/)
    })

    it("should format date string", () => {
      const formatted = formatTimestamp("2024-01-15T14:30:00")
      expect(formatted).toMatch(/Jan 15, 2024/)
      expect(formatted).toMatch(/2:30 PM/)
    })

    it("should handle different dates", () => {
      const date = new Date("2023-12-25T09:15:00")
      const formatted = formatTimestamp(date)
      expect(formatted).toMatch(/Dec 25, 2023/)
      expect(formatted).toMatch(/9:15 AM/)
    })
  })
})
