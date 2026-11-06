// Shapes returned by the pipeline's /api/monitor endpoints.

export interface VolumeRow {
  id: string
  title: string | null
  videos: number
  plays: number
  last_day: string | null
  gap_days: number
  plays_missing: number | null
}

export interface VolumeGroup {
  key: "channels" | "mcn" | "public"
  label: string
  rows: VolumeRow[]
  total: {
    videos: number
    plays: number
    gap_days: number
    plays_missing: number
  }
}

export interface VolumePanel {
  window_days: number
  groups: VolumeGroup[]
  fetched_at: string
}

export interface ChainStream {
  table: string
  label: string
  cadence: "daily" | "weekly" | "monthly"
  rows_today: number
  rows_yesterday: number
  last_run: string | null
  quiet_hours: number | null
  stale: boolean
}

export interface ChainPanel {
  streams: ChainStream[]
  stale_count: number
  fetched_at: string
}
