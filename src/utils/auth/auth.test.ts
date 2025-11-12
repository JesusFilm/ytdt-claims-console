import {
  getToken,
  setToken,
  removeToken,
  getAuthUrl,
  getCurrentUser,
  logout,
  authFetch,
} from "."

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe("getToken", () => {
    it("should return null when no token exists", () => {
      expect(getToken()).toBeNull()
    })

    it("should return token from localStorage", () => {
      localStorage.setItem("auth_token", "test-token")
      expect(getToken()).toBe("test-token")
    })

    it("should return null in server environment", () => {
      const originalWindow = global.window
      // @ts-expect-error - testing server environment
      global.window = undefined
      expect(getToken()).toBeNull()
      global.window = originalWindow
    })
  })

  describe("setToken", () => {
    it("should set token in localStorage", () => {
      setToken("test-token")
      expect(localStorage.getItem("auth_token")).toBe("test-token")
    })

    it("should overwrite existing token", () => {
      localStorage.setItem("auth_token", "old-token")
      setToken("new-token")
      expect(localStorage.getItem("auth_token")).toBe("new-token")
    })
  })

  describe("removeToken", () => {
    it("should remove token from localStorage", () => {
      localStorage.setItem("auth_token", "test-token")
      removeToken()
      expect(localStorage.getItem("auth_token")).toBeNull()
    })

    it("should handle removing non-existent token", () => {
      removeToken()
      expect(localStorage.getItem("auth_token")).toBeNull()
    })
  })

  describe("getAuthUrl", () => {
    it("should fetch and return auth URL", async () => {
      const mockAuthUrl = "https://accounts.google.com/auth"
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ authUrl: mockAuthUrl }),
      })

      const result = await getAuthUrl()
      expect(result).toBe(mockAuthUrl)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/google")
      )
    })
  })

  describe("getCurrentUser", () => {
    it("should return null when no token exists", async () => {
      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it("should fetch and return user data", async () => {
      const mockUser = { id: "1", email: "test@example.com" }
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      })

      const result = await getCurrentUser()
      expect(result).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/me"),
        {
          headers: { Authorization: "Bearer test-token" },
        }
      )
    })

    it("should remove token and return null on 401", async () => {
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      const result = await getCurrentUser()
      expect(result).toBeNull()
      expect(localStorage.getItem("auth_token")).toBeNull()
    })

    it("should remove token and return null on error", async () => {
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

      const result = await getCurrentUser()
      expect(result).toBeNull()
      expect(localStorage.getItem("auth_token")).toBeNull()
    })
  })

  describe("logout", () => {
    it("should call logout endpoint and remove token", async () => {
      localStorage.setItem("auth_token", "test-token")
      const mockLocation = { href: "" }
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      })

      await logout()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/logout"),
        {
          method: "POST",
          headers: { Authorization: "Bearer test-token" },
        }
      )
      expect(localStorage.getItem("auth_token")).toBeNull()
      expect(mockLocation.href).toBe("/")
    })

    it("should redirect even when no token exists", async () => {
      const mockLocation = { href: "" }
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      })

      await logout()

      expect(mockLocation.href).toBe("/")
    })
  })

  describe("authFetch", () => {
    it("should add Authorization header when token exists", async () => {
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await authFetch("/api/test")

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      )
    })

    it("should not add Authorization header when no token", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await authFetch("/api/test")

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        {
          headers: {},
        }
      )
    })

    it("should merge with existing headers", async () => {
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await authFetch("/api/test", {
        headers: { "Content-Type": "application/json" },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
        }
      )
    })

    it("should pass through other options", async () => {
      localStorage.setItem("auth_token", "test-token")

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await authFetch("/api/test", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ test: "data" }),
        })
      )
    })
  })
})
