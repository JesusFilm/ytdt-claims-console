"use client"

import { Fragment, FC, useCallback, useEffect, useState } from "react"

import { AlertCircle, CheckCircle, Minus } from "lucide-react"

import RefreshButton from "@/components/RefreshButton"
import { helpHref, type HelpKey } from "@/help/anchors"
import type {
  ChainPanel,
  ChainStream,
  VolumeGroup,
  VolumePanel,
  VolumeRow,
} from "@/types/Monitor"
import { authFetch } from "@/utils/auth"

// The label itself is the link, same as the collection tab: the explanation
// belongs where the question is.
const HelpLabel: FC<{ label: string; help?: HelpKey }> = ({ label, help }) =>
  help ? (
    <a
      href={helpHref(help)}
      className="hover:underline decoration-dotted underline-offset-2"
      title={`What "${label}" means`}
    >
      {label}
    </a>
  ) : (
    <span>{label}</span>
  )

const count = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US")

// Plays run to millions, and an exact figure helps nobody scanning a column.
const plays = (n: number | null | undefined) => {
  if (n == null) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

const CADENCE_LABELS: Record<ChainStream["cadence"], string> = {
  daily: "every day",
  weekly: "every week",
  monthly: "every month",
}

function gapTone(days: number): string {
  if (days >= 4) return "text-red-600"
  if (days >= 1) return "text-amber-600"
  return "text-gray-900"
}

const VolumeRowCells: FC<{ row: VolumeRow }> = ({ row }) => (
  <tr className="border-b border-gray-100 last:border-0">
    <td className="py-2 pr-3 text-gray-900">{row.title || row.id}</td>
    <td className="py-2 px-3 text-right tabular-nums text-gray-600">
      {count(row.videos)}
    </td>
    <td className="py-2 px-3 text-right tabular-nums text-gray-900">
      {plays(row.plays)}
    </td>
    <td
      className={`py-2 px-3 ${row.last_day ? "text-gray-600" : "text-gray-400"}`}
    >
      {row.last_day || "never"}
    </td>
    <td
      className={`py-2 px-3 text-right tabular-nums ${gapTone(row.gap_days)}`}
    >
      {row.gap_days}
    </td>
    <td
      className={`py-2 pl-3 text-right tabular-nums ${
        row.plays_missing ? gapTone(row.gap_days) : "text-gray-400"
      }`}
    >
      {row.plays_missing ? `~${plays(row.plays_missing)}` : "—"}
    </td>
  </tr>
)

const GROUP_NOTES: Partial<Record<VolumeGroup["key"], HelpKey>> = {
  mcn: "mcnSeparate",
}

const VolumeTable: FC<{ panel: VolumePanel }> = ({ panel }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
        <th className="py-2 pr-3 font-medium">Source</th>
        <th className="py-2 px-3 font-medium text-right">Videos</th>
        <th className="py-2 px-3 font-medium text-right">
          <HelpLabel
            label={`Plays, ${panel.window_days}d`}
            help="playsWindow"
          />
        </th>
        <th className="py-2 px-3 font-medium">Last day</th>
        <th className="py-2 px-3 font-medium text-right">
          <HelpLabel label="Days behind" help="gapDays" />
        </th>
        <th className="py-2 pl-3 font-medium text-right">
          <HelpLabel label="Plays missing (est.)" help="playsMissing" />
        </th>
      </tr>
    </thead>
    <tbody>
      {panel.groups.map((group) => (
        <Fragment key={group.key}>
          <tr className="bg-gray-50">
            <td colSpan={6} className="py-1.5 px-2 text-xs text-gray-600">
              {group.label}
              {GROUP_NOTES[group.key] && (
                <>
                  {" · "}
                  <HelpLabel
                    label="counted separately"
                    help={GROUP_NOTES[group.key]}
                  />
                </>
              )}
            </td>
          </tr>
          {group.rows.map((row) => (
            <VolumeRowCells key={row.id} row={row} />
          ))}
          {group.rows.length > 1 && (
            <tr className="border-b border-gray-200 font-medium">
              <td className="py-2 pr-3">{group.label} total</td>
              <td className="py-2 px-3 text-right tabular-nums">
                {count(group.total.videos)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {plays(group.total.plays)}
              </td>
              <td />
              <td className="py-2 px-3 text-right tabular-nums">
                {group.total.gap_days}
              </td>
              <td
                className={`py-2 pl-3 text-right tabular-nums ${
                  group.total.plays_missing ? "text-red-600" : "text-gray-400"
                }`}
              >
                {group.total.plays_missing
                  ? `~${plays(group.total.plays_missing)}`
                  : "—"}
              </td>
            </tr>
          )}
        </Fragment>
      ))}
    </tbody>
  </table>
)

const ChainTable: FC<{ panel: ChainPanel }> = ({ panel }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
        <th className="py-2 pr-3 font-medium">Stream</th>
        <th className="py-2 px-3 font-medium">Runs</th>
        <th className="py-2 px-3 font-medium text-right">Rows, last 24h</th>
        <th className="py-2 px-3 font-medium text-right">24h before</th>
        <th className="py-2 px-3 font-medium text-right">
          <HelpLabel label="Quiet for" help="streamQuiet" />
        </th>
        <th className="py-2 pl-3 font-medium">State</th>
      </tr>
    </thead>
    <tbody>
      {panel.streams.map((stream) => {
        // Only a daily stream can be judged against yesterday. A weekly or
        // monthly one is quiet most days by design, and flagging that would
        // cry wolf until nobody looks.
        const dropped =
          stream.cadence === "daily" &&
          stream.rows_yesterday > 100 &&
          stream.rows_today < stream.rows_yesterday / 4

        return (
          <tr
            key={stream.table}
            className="border-b border-gray-100 last:border-0"
          >
            <td className="py-2 pr-3 text-gray-900">{stream.label}</td>
            <td className="py-2 px-3 text-gray-500">
              {CADENCE_LABELS[stream.cadence]}
            </td>
            <td
              className={`py-2 px-3 text-right tabular-nums ${
                dropped ? "text-amber-600" : "text-gray-900"
              }`}
            >
              {count(stream.rows_today)}
            </td>
            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
              {count(stream.rows_yesterday)}
            </td>
            <td className="py-2 px-3 text-right tabular-nums text-gray-600">
              {stream.quiet_hours == null ? "—" : `${stream.quiet_hours}h`}
            </td>
            <td className="py-2 pl-3">
              {stream.stale ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ran
                </span>
              )}
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>
)

const Card: FC<{ label: React.ReactNode; value: string; tone?: string }> = ({
  label,
  value,
  tone = "text-gray-900",
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`text-2xl font-medium ${tone}`}>{value}</div>
  </div>
)

const PipelineMonitorTab: FC = () => {
  const [volume, setVolume] = useState<VolumePanel | null>(null)
  const [chain, setChain] = useState<ChainPanel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (fresh = false) => {
    setLoading(true)
    const query = fresh ? "?fresh=1" : ""
    try {
      const [volumeRes, chainRes] = await Promise.all([
        authFetch(`/api/monitor/volume${query}`),
        authFetch(`/api/monitor/chain${query}`),
      ])
      if (!volumeRes.ok || !chainRes.ok) throw new Error("Could not load")
      setVolume(await volumeRes.json())
      setChain(await chainRes.json())
      setError(null)
    } catch {
      setError("Could not read the pipeline. Try again in a moment.")
    } finally {
      setLoading(false)
    }
  }, [])

  // The answers are cached for five minutes on the server, so polling costs
  // nothing extra and the page is current when someone looks up at it.
  useEffect(() => {
    load()
    const timer = setInterval(() => load(), 60_000)
    return () => clearInterval(timer)
  }, [load])

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
        {error}
      </div>
    )
  }

  if (!volume || !chain) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        Reading the pipeline&hellip;
      </div>
    )
  }

  // Channels and MCN are the two play-bearing groups; the public sheet is
  // counted on its own because it stores running totals, not daily plays.
  const played = volume.groups
    .filter((group) => group.key !== "public")
    .reduce((sum, group) => sum + group.total.plays, 0)
  const missing = volume.groups.reduce(
    (sum, group) => sum + group.total.plays_missing,
    0
  )
  const behind = volume.groups
    .flatMap((group) => group.rows)
    .filter((row) => row.gap_days > 0).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          label={`Plays, last ${volume.window_days} days`}
          value={plays(played)}
        />
        <Card
          label="Sources behind"
          value={String(behind)}
          tone={behind ? "text-amber-600" : "text-gray-900"}
        />
        <Card
          label={<HelpLabel label="Plays missing (est.)" help="playsMissing" />}
          value={missing ? `~${plays(missing)}` : "0"}
          tone={missing ? "text-red-600" : "text-gray-900"}
        />
        <Card
          label="Streams overdue"
          value={String(chain.stale_count)}
          tone={chain.stale_count ? "text-red-600" : "text-gray-900"}
        />
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-1">
          What we hold, and what is missing
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Counted up to yesterday, because today is still being collected.
        </p>
        <VolumeTable panel={volume} />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-1">
          When each stream last ran
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Yesterday&rsquo;s count is there to compare against: a stream can run
          and still bring far less than usual.
        </p>
        <ChainTable panel={chain} />
      </section>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Minus className="w-3 h-3" />
          Updates on its own every minute
        </span>
        <RefreshButton onRefresh={() => load(true)} disabled={loading} />
      </div>
    </div>
  )
}

export default PipelineMonitorTab
