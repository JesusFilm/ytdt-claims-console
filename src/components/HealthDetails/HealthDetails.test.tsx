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
  host_uptime: 1900800,
  mongo_status: "healthy" as const,
  mongo_uptime: 1900800,
  mongo_version: "6.0.26",
  disk: { free_gb: 25, total_gb: 52 },
  schedules: [
    {
      name: "Claims ingest",
      enabled: true,
      time_utc: "06:00",
      next_run: "2026-10-24T06:00:00.000Z",
    },
    {
      name: "MySQL -> BigQuery mirror",
      enabled: false,
      time_utc: "03:00",
      next_run: null,
    },
  ],
}

describe("HealthDetails", () => {
  it("should name both services and the build each is running", async () => {
    authFetch.mockImplementation(async () => ({ json: async () => HEALTH }))
    render(<HealthDetails />)

    await waitFor(() => expect(screen.getByText("Claims API")).toBeVisible())
    expect(screen.getByText("YT-Validator")).toBeVisible()
    expect(screen.getByText("MongoDB")).toBeVisible()
    expect(screen.getAllByText("Healthy")).toHaveLength(3)
    expect(screen.getByText(/main@abc1234/)).toBeVisible()
    expect(screen.getByText(/main@def5678/)).toBeVisible()
  })

  it("should separate the machine's uptime from the service's", async () => {
    authFetch.mockImplementation(async () => ({ json: async () => HEALTH }))
    render(<HealthDetails />)

    // The VM has been up 22 days across deploys; this process, 1d 2h.
    await waitFor(() => expect(screen.getAllByText("22d 0h")).toHaveLength(2))
    expect(screen.getByText("1d 2h")).toBeVisible()
    expect(screen.getByText(/disk 25 of 52 GB free/)).toBeVisible()
  })

  it("should say whether each scheduled job is armed", async () => {
    authFetch.mockImplementation(async () => ({ json: async () => HEALTH }))
    render(<HealthDetails />)

    await waitFor(() => expect(screen.getByText("Claims ingest")).toBeVisible())
    expect(screen.getByText("Armed")).toBeVisible()
    expect(screen.getByText("Off")).toBeVisible()
    expect(screen.getByText("06:00 UTC")).toBeVisible()
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
