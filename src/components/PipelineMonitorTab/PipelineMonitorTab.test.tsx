import { render, screen, waitFor } from "@testing-library/react"

import type { ChainPanel, VolumePanel } from "@/types/Monitor"

import PipelineMonitorTab from "."

vi.mock("@/utils/auth", async () => {
  const actual = await vi.importActual("@/utils/auth")
  return { ...actual, authFetch: vi.fn() }
})

const volume: VolumePanel = {
  window_days: 30,
  fetched_at: "2026-11-05T12:00:00.000Z",
  groups: [
    {
      key: "channels",
      label: "Channels",
      rows: [
        {
          id: "UCCtcQHR6",
          title: "Jesus Film",
          videos: 5587,
          plays: 5_300_000,
          last_day: "2026-11-02",
          gap_days: 2,
          plays_missing: 379_000,
        },
        {
          id: "UCitJesus",
          title: "it.Jesus.net",
          videos: 2702,
          plays: 0,
          last_day: null,
          gap_days: 30,
          plays_missing: null,
        },
      ],
      total: {
        videos: 8289,
        plays: 5_300_000,
        gap_days: 32,
        plays_missing: 379_000,
      },
    },
    {
      key: "mcn",
      label: "MCN",
      rows: [
        {
          id: "J8g7R47ksUHF78DMrbZXYw",
          title: "Matter Entertainment",
          videos: 13625,
          plays: 4_800_000,
          last_day: "2026-10-29",
          gap_days: 6,
          plays_missing: 1_190_000,
        },
      ],
      total: {
        videos: 13625,
        plays: 4_800_000,
        gap_days: 6,
        plays_missing: 1_190_000,
      },
    },
  ],
}

const chain: ChainPanel = {
  stale_count: 1,
  fetched_at: "2026-11-05T12:00:00.000Z",
  streams: [
    {
      table: "youtube_video_views_by_day",
      label: "Plays by day",
      cadence: "daily",
      rows_today: 163_761,
      rows_yesterday: 158_200,
      last_run: "2026-11-05T11:00:00.000Z",
      quiet_hours: 1,
      stale: false,
    },
    {
      table: "youtube_video_views_by_day_mcn",
      label: "Plays by day, MCN",
      cadence: "weekly",
      rows_today: 0,
      rows_yesterday: 42_000,
      last_run: "2026-10-29T21:00:00.000Z",
      quiet_hours: 207,
      stale: true,
    },
  ],
}

const mockPanels = async (overrides: Partial<ChainPanel> = {}) => {
  const { authFetch } = await import("@/utils/auth")
  vi.mocked(authFetch).mockImplementation(
    async (url: string) =>
      ({
        ok: true,
        status: 200,
        json: async () =>
          url.includes("volume") ? volume : { ...chain, ...overrides },
      }) as Response
  )
}

describe("PipelineMonitorTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should summarise plays, gaps and overdue streams", async () => {
    await mockPanels()
    render(<PipelineMonitorTab />)

    await waitFor(() => {
      expect(screen.getByText("Jesus Film")).toBeInTheDocument()
    })
    // channels plus MCN, with the public sheet left out of the headline
    expect(screen.getByText("10.1M")).toBeInTheDocument()
    // both channel rows are behind, and so is the one MCN row
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("~1.6M")).toBeInTheDocument()
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("should show a channel that never collected rather than hide it", async () => {
    await mockPanels()
    render(<PipelineMonitorTab />)

    await waitFor(() => {
      expect(screen.getByText("it.Jesus.net")).toBeInTheDocument()
    })
    expect(screen.getByText("never")).toBeInTheDocument()
  })

  it("should not call a weekly stream quiet when it is between runs", async () => {
    // A weekly stream brings nothing most days by design. Flagging that as a
    // drop would cry wolf until nobody looks.
    await mockPanels({
      streams: chain.streams.map((s) => ({ ...s, stale: false })),
      stale_count: 0,
    })
    render(<PipelineMonitorTab />)

    await waitFor(() => {
      expect(screen.getByText("Plays by day, MCN")).toBeInTheDocument()
    })
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument()
    const mcnRow = screen.getByText("Plays by day, MCN").closest("tr")!
    expect(mcnRow.querySelectorAll("td")[2]).toHaveClass("text-gray-900")
  })

  it("should say so when the pipeline cannot be read", async () => {
    const { authFetch } = await import("@/utils/auth")
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)
    render(<PipelineMonitorTab />)

    await waitFor(() => {
      expect(
        screen.getByText(/Could not read the pipeline/)
      ).toBeInTheDocument()
    })
  })
})
