import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import type { ClaimsIngestStatus } from "@/types/ClaimsIngest"

import ClaimsCollectionTab, {
  audioLanguageBreakdown,
  audioLanguageProgress,
  daysOld,
  formatUtc,
  nextRunUtc,
  timeUntil,
} from "."

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

  it("should open a recent run in history", async () => {
    const onOpenIngest = vi.fn()
    await mockStatus({
      ...completedRun,
      recent: [{ ...completedRun.recent[0], _id: "ingest-9" }],
    })
    render(<ClaimsCollectionTab onOpenIngest={onOpenIngest} />)

    await waitFor(() => {
      expect(screen.getByTitle("Open in history")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTitle("Open in history"))
    expect(onOpenIngest).toHaveBeenCalledWith("ingest-9")
  })

  it("should leave attempts stored without an id as plain rows", async () => {
    // Attempts predating the id in this payload have nowhere to link to
    await mockStatus(completedRun)
    render(<ClaimsCollectionTab onOpenIngest={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText("Recent runs")).toBeInTheDocument()
    })
    expect(screen.queryByTitle("Open in history")).not.toBeInTheDocument()
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

  it("should show audio language as not started when the collector is unreachable", async () => {
    await mockStatus(completedRun) // no collector block at all (404 upstream)
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("Audio language")).toBeInTheDocument()
    })
    expect(screen.getByText("not started")).toBeInTheDocument()
    expect(screen.queryByText("Scoring")).not.toBeInTheDocument()
  })

  it("should treat an empty collector block as not started", async () => {
    // after /asr/status deploys but before the collector's first run
    await mockStatus({
      ...completedRun,
      collector: { queue: {}, cache: {}, collector: {} },
    })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("not started")).toBeInTheDocument()
    })
  })

  it("should show audio-language progress and flag a run stopped on quota", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        queue: { rows: 4429 },
        collector: {
          last_run: "2026-09-16T08:15:04Z",
          looked_up: 180,
          remaining: 4229,
          queue_videos_needing_asr: 4405,
          stopped_reason: "quota",
        },
      },
    })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("176 of 4,405 videos")).toBeInTheDocument()
    })
    expect(
      screen.getByText(/stopped early on the daily quota/)
    ).toBeInTheDocument()
    expect(screen.getByText(/not live/)).toBeInTheDocument()
  })

  it("should derive audio-language progress, ignoring an absent collector", () => {
    expect(audioLanguageProgress(null)).toBeNull()
    expect(audioLanguageProgress({ collector: {} })).toBeNull()
    expect(
      audioLanguageProgress({
        queue: { rows: 100 },
        collector: { remaining: 40, queue_videos_needing_asr: 90 },
      })
    ).toMatchObject({ total: 90, done: 50, remaining: 40 })
    // falls back to queue.rows when the collector doesn't report a total
    expect(
      audioLanguageProgress({
        queue: { rows: 100 },
        collector: { remaining: 40 },
      })
    ).toMatchObject({ total: 100, done: 60 })
  })

  it("should split resolved videos into with and without a language", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        cache: { videos: 1240, with_track: 947, no_track: 293 },
        collector: { remaining: 3165, queue_videos_needing_asr: 4405 },
      },
    })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText(/947 with a language/)).toBeInTheDocument()
    })
    // "none usable" covers no ASR track, 403 and 404 alike — never "no captions"
    expect(screen.getByText(/293 with none usable/)).toBeInTheDocument()

    // it belongs to the Audio language step, not loose under the grid where it
    // read as if it described Published
    const step = screen.getByText("Audio language").closest("div")
    expect(step?.textContent).toMatch(/947 with a language/)
    expect(
      screen.getByText("Published").closest("div")?.textContent
    ).not.toMatch(/with a language/)
  })

  it("should omit the split until the cache reports anything", () => {
    expect(audioLanguageBreakdown(null)).toBeNull()
    expect(audioLanguageBreakdown({ cache: {} })).toBeNull()
    expect(
      audioLanguageBreakdown({
        cache: { videos: 2, with_track: 1, no_track: 1 },
      })
    ).toMatchObject({ videos: 2, withTrack: 1, noTrack: 1 })
  })

  it("should render report times in UTC, not the viewer's zone", () => {
    // 02:03 UTC is the previous evening in the Americas; it must not read as Sep 15
    expect(formatUtc("2026-09-16T02:03:17.718Z")).toBe("Sep 16, 02:03 UTC")
    expect(formatUtc(null)).toBe("—")
    expect(formatUtc("not a date")).toBe("—")
  })

  it("should age the snapshot in whole days", () => {
    const now = new Date("2026-09-16T02:00:00Z")
    expect(daysOld("2026-09-10", now)).toBe(6)
    expect(daysOld("2026-09-16", now)).toBe(0)
    expect(daysOld(null, now)).toBeNull()
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
