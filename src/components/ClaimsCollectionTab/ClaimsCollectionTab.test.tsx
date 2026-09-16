import { render, screen, waitFor } from "@testing-library/react"

import type { ClaimsIngestStatus } from "@/types/ClaimsIngest"

import ClaimsCollectionTab, { nextRunUtc, timeUntil } from "."

vi.mock("@/utils/auth", async () => {
  const actual = await vi.importActual("@/utils/auth")
  return { ...actual, authFetch: vi.fn() }
})

const completedRun: ClaimsIngestStatus = {
  enabled: true,
  authRequired: false,
  lastCompleted: {
    status: "completed",
    trigger: "schedule",
    startedAt: "2026-09-16T01:53:36.109Z",
    endedAt: "2026-09-16T02:03:17.718Z",
    reports: {
      matter_entertainment: {
        contentOwnerId: "J8g7R47ksUHF78DMrbZXYw",
        reportId: "20434750253",
        startTime: "2026-09-10T07:00:00Z",
        createTime: "2026-09-12T21:11:45.152Z",
      },
      matter_2: {
        contentOwnerId: "MjvkwLDytS3jM7M22BkMWg",
        reportId: "17603720228",
        startTime: "2026-09-10T07:00:00Z",
        createTime: "2026-09-12T20:31:07.135Z",
      },
    },
    results: {
      claimsProcessed: {
        matter_entertainment: { total: 475234, new: 1533 },
        matter_2: { total: 212845, new: 521 },
      },
      asrQueue: { rows: 4429, response: { status: "ok", rows: 4429 } },
    },
  },
  recent: [
    {
      status: "completed",
      startedAt: "2026-09-16T01:53:36.109Z",
    },
    {
      status: "nothing_new",
      startedAt: "2026-09-15T06:00:00.000Z",
    },
  ],
}

const mockStatus = async (body: ClaimsIngestStatus, ok = true) => {
  const { authFetch } = await import("@/utils/auth")
  vi.mocked(authFetch).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response)
}

describe("ClaimsCollectionTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should summarise the latest collection", async () => {
    await mockStatus(completedRun)
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("2026-09-10")).toBeInTheDocument()
    })
    // new claims across both owners, and the rows handed to the ASR queue
    expect(screen.getByText("2,054")).toBeInTheDocument()
    expect(screen.getByText("4,429")).toBeInTheDocument()
    expect(screen.getByText("Matter Entertainment")).toBeInTheDocument()
    expect(screen.getByText("Matter 2")).toBeInTheDocument()
  })

  it("should show a re-authorization warning when sign-in expired", async () => {
    await mockStatus({ ...completedRun, authRequired: true })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(
        screen.getByText(
          /Sign-in expired — claims are no longer being collected/
        )
      ).toBeInTheDocument()
    })
  })

  it("should show paused when the schedule is disabled", async () => {
    await mockStatus({ ...completedRun, enabled: false })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("Paused")).toBeInTheDocument()
    })
    expect(screen.queryByText("Scheduled")).not.toBeInTheDocument()
  })

  it("should invite the first run when nothing has been collected", async () => {
    await mockStatus({
      enabled: true,
      authRequired: false,
      lastCompleted: null,
      recent: [],
    })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(
        screen.getByText(/No claims have been collected yet/)
      ).toBeInTheDocument()
    })
  })

  it("should surface a failed status fetch", async () => {
    await mockStatus(completedRun, false)
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't load collection status")
      ).toBeInTheDocument()
    })
  })

  it("should label a nothing_new attempt in plain words", async () => {
    await mockStatus(completedRun)
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("no new snapshot")).toBeInTheDocument()
    })
  })

  it("should schedule the next run at 06:00 UTC", () => {
    const morning = new Date("2026-09-16T05:00:00Z")
    expect(nextRunUtc(morning).toISOString()).toBe("2026-09-16T06:00:00.000Z")
    expect(timeUntil(nextRunUtc(morning), morning)).toBe("1h 0m")

    // after today's run, the next one rolls to tomorrow
    const evening = new Date("2026-09-16T23:30:00Z")
    expect(nextRunUtc(evening).toISOString()).toBe("2026-09-17T06:00:00.000Z")
  })
})
