import { describe, it, expect } from "vitest"
import { formatDuration, formatTimestamp } from "@/utils/formatTime"

describe("formatTime", () => {
  describe("formatDuration", () => {
    it("should format milliseconds to human readable duration", () => {
      expect(formatDuration(1000)).toBe("1s")
      expect(formatDuration(60000)).toBe("1m 0s")
      expect(formatDuration(61000)).toBe("1m 1s")
      expect(formatDuration(3661000)).toBe("61m 1s")
      expect(formatDuration(undefined)).toBe("♾️")
    })
  })

  describe("formatTimestamp", () => {
    it("should format date to readable string", () => {
      const date = new Date("2024-01-01T12:00:00Z")
      const formatted = formatTimestamp(date)
      expect(formatted).toContain("2024")
    })

    it("should handle string dates", () => {
      const formatted = formatTimestamp("2024-01-01T12:00:00Z")
      expect(formatted).toContain("2024")
    })
  })
})
