describe("env", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("should export env object", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://test.example.com"
    process.env.SKIP_ENV_VALIDATION = "true"
    const { env } = await import("./env")
    expect(env).toBeDefined()
    expect(env.NEXT_PUBLIC_API_URL).toBe("http://test.example.com")
  })

  it("should export env object", async () => {
    process.env.SKIP_ENV_VALIDATION = "true"
    process.env.NEXT_PUBLIC_API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    const { env } = await import("./env")
    expect(env).toBeDefined()
  })
})
