import { render, screen, waitFor } from "@testing-library/react"

import HealthDetails from "."

const authFetch = vi.hoisted(() => vi.fn())
vi.mock("@/utils/auth", () => ({ authFetch }))

const HEALTH = {
  status: "ok",
  uptime: 93600,
  memory: { used: 41, total: 72 },
  enrich_ml_status: "healthy" as const,
  version: "2.0.0",
  branch: "main",
  commit: "abc1234",
  enrich_ml_version: "1.4.0",
  enrich_ml_branch: "main",
  enrich_ml_commit: "def5678",
}

describe("HealthDetails", () => {
  it("should name both services and the build each is running", async () => {
    authFetch.mockImplementation(async () => ({ json: async () => HEALTH }))
    render(<HealthDetails />)

    await waitFor(() => expect(screen.getByText("Claims API")).toBeVisible())
    expect(screen.getByText("YT-Validator")).toBeVisible()
    expect(screen.getAllByText("Healthy")).toHaveLength(2)
    expect(screen.getByText(/up 1d 2h/)).toBeVisible()
    expect(screen.getByText(/main@abc1234/)).toBeVisible()
    expect(screen.getByText(/main@def5678/)).toBeVisible()
  })

  it("should say which service is down when the API reports degraded", async () => {
    authFetch.mockImplementation(async () => ({
      json: async () => ({
        ...HEALTH,
        status: "degraded",
        enrich_ml_status: "unhealthy",
      }),
    }))
    render(<HealthDetails />)

    await waitFor(() => expect(screen.getByText("Degraded")).toBeVisible())
    expect(screen.getByText("Not responding")).toBeVisible()
  })

  it("should explain itself when the health check does not answer", async () => {
    authFetch.mockImplementation(async () => {
      throw new Error("offline")
    })
    render(<HealthDetails />)

    await waitFor(() =>
      expect(screen.getByText(/did not answer/)).toBeVisible()
    )
  })
})
