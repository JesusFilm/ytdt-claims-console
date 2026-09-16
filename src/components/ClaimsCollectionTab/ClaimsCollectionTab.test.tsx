import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import type { ClaimsIngestStatus } from "@/types/ClaimsIngest"

import ClaimsCollectionTab, {
  audioLanguageBreakdown,
  audioLanguageProgress,
  collectorLastRun,
  daysOld,
  formatUtc,
  nextRunUtc,
  parseUtc,
  ownerSnapshots,
  snapshotRange,
  topAudioLanguages,
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

  // 2026-09-16: the 06:00 run fetched only Matter 2; Matter Entertainment's
  // newest report was already ingested by the 01:53 run.
  const scheduledRun: ClaimsIngestStatus = {
    ...completedRun,
    lastCompleted: {
      _id: "6aaa3060d219fb53d27974d7",
      status: "completed",
      trigger: "schedule",
      startedAt: "2026-09-16T06:00:00.024Z",
      endedAt: "2026-09-16T06:04:11.000Z",
      reports: {
        matter_2: {
          contentOwnerId: "MjvkwLDytS3jM7M22BkMWg",
          reportId: "17608817954",
          startTime: "2026-09-14T07:00:00Z",
          createTime: "2026-09-16T05:28:09.139Z",
        },
      },
      results: {
        claimsProcessed: { matter_2: { total: 212938, new: 120 } },
        asrQueue: { rows: 4549 },
      },
    },
    owners: [
      {
        source: "matter_entertainment",
        snapshot: "2026-09-10",
        publishedAt: "2026-09-12T21:11:45.152Z",
        ingestedAt: "2026-09-16T02:03:17.718Z",
        new: 1533,
        total: 475234,
        ingestId: "6aa9f6a0df9ae860c98e0204",
      },
      {
        source: "matter_2",
        snapshot: "2026-09-14",
        publishedAt: "2026-09-16T05:28:09.139Z",
        ingestedAt: "2026-09-16T06:04:11.000Z",
        new: 120,
        total: 212938,
        ingestId: "6aaa3060d219fb53d27974d7",
      },
    ],
  }

  it("should keep an owner the latest run skipped, saying it has nothing newer", async () => {
    await mockStatus(scheduledRun)
    render(<ClaimsCollectionTab />)

    const me = await waitFor(() => {
      const row = document.querySelector('[data-owner="matter_entertainment"]')
      expect(row).not.toBeNull()
      return row
    })
    expect(me?.textContent).toBe(
      "Matter Entertainment · snapshot 2026-09-10 · no newer report yet1,533 new of 475,234"
    )
    // the owner that did come in with the latest run is not flagged
    expect(document.querySelector('[data-owner="matter_2"]')?.textContent).toBe(
      "Matter 2 · snapshot 2026-09-14120 new of 212,938"
    )
  })

  it("should give claims a date range across owners, and scope new claims to the run", async () => {
    vi.useFakeTimers({
      now: new Date("2026-09-16T12:00:00Z"),
      toFake: ["Date"],
    })
    try {
      await mockStatus(scheduledRun)
      render(<ClaimsCollectionTab />)

      await waitFor(() => {
        expect(screen.getByText("2026-09-10 – 2026-09-14")).toBeInTheDocument()
      })
      // the age that matters is the oldest owner's
      expect(screen.getByText("oldest 6 days old")).toBeInTheDocument()
      expect(
        screen.getByText("of 212,938 scanned · Sep 16, 06:00 UTC run")
      ).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it("should list an owner never ingested rather than drop it", () => {
    const owners = ownerSnapshots({
      ...scheduledRun,
      owners: [
        { ...scheduledRun.owners![1] },
        {
          source: "matter_entertainment",
          snapshot: null,
          publishedAt: null,
          ingestedAt: null,
          new: null,
          total: null,
          ingestId: null,
        },
      ],
    })
    expect(owners.map((o) => o.source)).toEqual([
      "matter_2",
      "matter_entertainment",
    ])
    // a missing owner does not narrow the range to look fresher
    expect(snapshotRange(owners)).toEqual({
      oldest: "2026-09-14",
      newest: "2026-09-14",
    })
  })

  it("should fall back to the latest run against an API without owners", () => {
    const owners = ownerSnapshots({ ...scheduledRun, owners: undefined })
    expect(owners).toHaveLength(1)
    expect(owners[0]).toMatchObject({
      source: "matter_2",
      snapshot: "2026-09-14",
      new: 120,
      current: true,
    })
    expect(snapshotRange([])).toBeNull()
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

  it("should show the collector's last run under the audio language step", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        queue: { rows: 4523 },
        cache: { videos: 182, with_track: 166, no_track: 16 },
        collector: {
          // naive, as YT-Validator sends it today: this IS UTC
          last_run: "2026-09-16T08:16:10",
          looked_up: 180,
          added: 180,
          failed: 0,
          remaining: 4341,
          queue_videos_needing_asr: 4523,
          stopped_reason: null,
        },
      },
    })
    render(<ClaimsCollectionTab />)

    await waitFor(() => {
      expect(screen.getByText("182 of 4,523 videos")).toBeInTheDocument()
    })
    const lastRun = screen.getByText("last run").nextElementSibling
    expect(lastRun?.textContent).toBe(
      "Sep 16, 08:16 UTC · looked up 180 · added 180 · failed 0 · not stopped"
    )
    expect(screen.getByText("cache").nextElementSibling?.textContent).toBe(
      "182 videos: 166 with a language, 16 none usable"
    )
    expect(screen.getByText("remaining").nextElementSibling?.textContent).toBe(
      "4,341 of 4,523"
    )
    expect(screen.getByText(/not live/)).toBeInTheDocument()
    // the collector's log estimate ignores new arrivals, so it is not shown
    expect(screen.queryByText(/more days/)).not.toBeInTheDocument()
  })

  it("should list the top audio languages found, by name", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        // today's cache as the collector would count it
        cache: {
          videos: 182,
          with_track: 166,
          no_track: 16,
          languages: {
            es: 57,
            hi: 27,
            en: 26,
            id: 15,
            ru: 9,
            fr: 7,
            pt: 5,
            bn: 4,
            hy: 3,
          },
        },
        collector: { remaining: 4341, queue_videos_needing_asr: 4523 },
      },
    })
    render(<ClaimsCollectionTab />)

    const row = (await screen.findByText("top languages")).nextElementSibling
    expect(row?.textContent).toBe(
      "Spanish 57 · Hindi 27 · English 26 · Indonesian 15 · Russian 9 · +4 more"
    )
    // the code stays reachable for anyone matching against the data
    expect(screen.getByTitle("es").textContent).toBe("Spanish 57")
  })

  it("should reveal the remaining languages on request, and fold them back", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        cache: {
          videos: 182,
          with_track: 166,
          no_track: 16,
          languages: {
            es: 57,
            hi: 27,
            en: 26,
            id: 15,
            ru: 9,
            fr: 7,
            pt: 5,
            bn: 4,
            hy: 3,
          },
        },
        collector: { remaining: 4341, queue_videos_needing_asr: 4523 },
      },
    })
    render(<ClaimsCollectionTab />)

    const more = await screen.findByRole("button", { name: "+4 more" })
    expect(more.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByTitle("hy")).not.toBeInTheDocument()

    fireEvent.click(more)
    const row = screen.getByText("top languages").nextElementSibling
    expect(row?.textContent).toBe(
      "Spanish 57 · Hindi 27 · English 26 · Indonesian 15 · Russian 9 · " +
        "French 7 · Portuguese 5 · Bangla 4 · Armenian 3 · show fewer"
    )

    fireEvent.click(screen.getByRole("button", { name: "show fewer" }))
    expect(screen.queryByTitle("hy")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+4 more" })).toBeInTheDocument()
  })

  it("should leave out top languages until YT-Validator reports them", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        cache: { videos: 182, with_track: 166, no_track: 16 },
        collector: { remaining: 4341, queue_videos_needing_asr: 4523 },
      },
    })
    render(<ClaimsCollectionTab />)

    await screen.findByText("cache")
    expect(screen.queryByText("top languages")).not.toBeInTheDocument()
  })

  it("should rank languages without counting none usable", () => {
    expect(topAudioLanguages(null)).toBeNull()
    expect(topAudioLanguages({ cache: { languages: {} } })).toBeNull()
    // "" is none usable, already on the cache row
    expect(topAudioLanguages({ cache: { languages: { "": 16 } } })).toBeNull()

    const ranked = topAudioLanguages(
      { cache: { languages: { en: 3, "": 99, es: 3, hi: 5 } } },
      2
    )
    // ties break on code so the order doesn't shuffle between refreshes
    expect(ranked?.top.map((l) => l.code)).toEqual(["hi", "en"])
    expect(ranked?.more).toBe(1)
    // an unknown code still shows, as itself
    expect(
      topAudioLanguages({ cache: { languages: { "x-bogus!": 1 } } })?.top[0]
        .name
    ).toBe("x-bogus!")
  })

  it("should make a stopped run stand out, with the detail on hover", async () => {
    await mockStatus({
      ...completedRun,
      collector: {
        collector: {
          last_run: "2026-09-16T08:16:10+00:00",
          looked_up: 97,
          added: 90,
          failed: 7,
          remaining: 4251,
          queue_videos_needing_asr: 4523,
          stopped_reason: "quota",
          stopped_detail: "quotaExceeded on captions.list",
        },
      },
    })
    render(<ClaimsCollectionTab />)

    const label = await screen.findByText("stopped: quota exhausted")
    expect(label.getAttribute("title")).toBe("quotaExceeded on captions.list")
    expect(label.className).toMatch(/amber/)
    expect(screen.queryByText("not stopped")).not.toBeInTheDocument()
  })

  it("should label each way a collector run can stop", () => {
    const run = (stopped_reason: "quota" | "outage" | null) =>
      collectorLastRun({
        collector: { last_run: "2026-09-16T08:16:10", stopped_reason },
      })

    expect(run(null)).toMatchObject({
      stopped: false,
      stoppedLabel: "not stopped",
    })
    expect(run("quota")?.stoppedLabel).toBe("stopped: quota exhausted")
    expect(run("outage")?.stoppedLabel).toBe("stopped: YouTube unreachable")
    // nothing to say until the collector has run at least once
    expect(collectorLastRun({ collector: {} })).toBeNull()
    expect(collectorLastRun(null)).toBeNull()
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

  it("should omit the split until the cache reports anything", () => {
    expect(audioLanguageBreakdown(null)).toBeNull()
    expect(audioLanguageBreakdown({ cache: {} })).toBeNull()
    expect(
      audioLanguageBreakdown({
        cache: { videos: 2, with_track: 1, no_track: 1 },
      })
    ).toMatchObject({ videos: 2, withTrack: 1, noTrack: 1 })
  })

  it("should read a timestamp without an offset as UTC, whatever the viewer's zone", () => {
    const zone = process.env.TZ
    // six hours behind UTC: where 08:16 used to display as 14:16's mirror
    process.env.TZ = "America/Chicago"
    try {
      expect(formatUtc("2026-09-16T08:16:10")).toBe("Sep 16, 08:16 UTC")
      // the same instant once YT-Validator sends its offset, and in Z form
      expect(formatUtc("2026-09-16T08:16:10+00:00")).toBe("Sep 16, 08:16 UTC")
      expect(formatUtc("2026-09-16T08:16:10Z")).toBe("Sep 16, 08:16 UTC")
      // a real offset is honoured, not overwritten
      expect(parseUtc("2026-09-16T10:16:10+02:00")?.toISOString()).toBe(
        "2026-09-16T08:16:10.000Z"
      )
    } finally {
      process.env.TZ = zone
    }
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
