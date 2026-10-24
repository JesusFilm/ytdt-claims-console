"use client"

import { useEffect, useState } from "react"

import { authFetch } from "@/utils/auth"

/**
 * What the green dot in the header is actually checking.
 *
 * The dashboard shows one word — healthy, degraded, offline. This is the
 * same /api/health response spelled out, so someone who sees "degraded" can
 * tell which of the two services is unhappy and which build each is running.
 */

interface Health {
  status: string
  uptime: number
  host_uptime?: number
  mongo_status?: "healthy" | "unhealthy"
  mongo_uptime?: number
  mongo_version?: string
  disk?: { free_gb: number; total_gb: number } | null
  schedules?: {
    name: string
    enabled: boolean
    time_utc: string | null
    next_run: string | null
  }[]
  memory: { used: number; total: number }
  enrich_ml_status?: "healthy" | "unhealthy" | "disabled"
  version?: string
  branch?: string
  commit?: string
  enrich_ml_version?: string
  enrich_ml_branch?: string
  enrich_ml_commit?: string
}

const duration = (seconds: number) => {
  if (!seconds) return "—"
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days) return `${days}d ${hours}h`
  if (hours) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const build = (version?: string, branch?: string, commit?: string) => {
  const parts = [version, branch && commit ? `${branch}@${commit}` : branch]
  const text = parts.filter(Boolean).join(" · ")
  return text || "—"
}

const WORDING: Record<string, { label: string; tone: string }> = {
  ok: { label: "Healthy", tone: "text-green-700" },
  healthy: { label: "Healthy", tone: "text-green-700" },
  degraded: { label: "Degraded", tone: "text-orange-600" },
  unhealthy: { label: "Not responding", tone: "text-orange-600" },
  disabled: { label: "Disabled", tone: "text-gray-500" },
}

const Status = ({ value }: { value?: string }) => {
  const word = value ? WORDING[value] : undefined
  return (
    <span className={word?.tone ?? "text-red-600"}>
      {word?.label ?? "Offline"}
    </span>
  )
}

export default function HealthDetails() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    authFetch("/api/health")
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setFailed(true))
  }, [])

  if (failed)
    return (
      <p className="text-sm text-gray-600">
        The health check did not answer. The API is down, or this console is
        pointed at the wrong address.
      </p>
    )

  if (!health) return <p className="text-sm text-gray-500">Checking…</p>

  const rows = [
    {
      service: "Claims API",
      host: "ytdt-claims",
      status: <Status value={health.status} />,
      machineUp: duration(health.host_uptime ?? 0),
      serviceUp: duration(health.uptime),
      detail: build(health.version, health.branch, health.commit),
    },
    {
      service: "MongoDB",
      host: "ytdt-mongodb",
      status: <Status value={health.mongo_status} />,
      machineUp: "—",
      serviceUp: duration(health.mongo_uptime ?? 0),
      detail: health.mongo_version ?? "—",
    },
    {
      service: "YT-Validator",
      host: "Cloud Run",
      status: <Status value={health.enrich_ml_status} />,
      machineUp: "—",
      serviceUp: "—",
      detail: build(
        health.enrich_ml_version,
        health.enrich_ml_branch,
        health.enrich_ml_commit
      ),
    },
  ]

  return (
    <div className="space-y-2">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Service</th>
            <th className="py-2 pr-4 font-medium">Runs on</th>
            <th className="py-2 pr-4 font-medium">State</th>
            <th className="py-2 pr-4 font-medium">Machine up</th>
            <th className="py-2 pr-4 font-medium">Service up</th>
            <th className="py-2 font-medium">Build</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.service} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-900">
                {row.service}
              </td>
              <td className="py-2 pr-4 text-gray-600">{row.host}</td>
              <td className="py-2 pr-4">{row.status}</td>
              <td className="py-2 pr-4 text-gray-600">{row.machineUp}</td>
              <td className="py-2 pr-4 text-gray-600">{row.serviceUp}</td>
              <td className="py-2 text-gray-600">{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {health.schedules && health.schedules.length > 0 && (
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Scheduled job</th>
              <th className="py-2 pr-4 font-medium">State</th>
              <th className="py-2 pr-4 font-medium">Runs at</th>
              <th className="py-2 font-medium">Next run</th>
            </tr>
          </thead>
          <tbody>
            {health.schedules.map((job) => (
              <tr key={job.name} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-900">
                  {job.name}
                </td>
                <td className="py-2 pr-4">
                  {job.enabled ? (
                    <span className="text-green-700">Armed</span>
                  ) : (
                    <span className="text-gray-500">Off</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-600">
                  {job.time_utc ? `${job.time_utc} UTC` : "—"}
                </td>
                <td className="py-2 text-gray-600">
                  {job.next_run
                    ? new Date(job.next_run).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-gray-500">
        Machine up is the VM&apos;s own uptime — a drop means someone rebooted
        it. Service up resets on every deploy.{" "}
        {health.disk
          ? `ytdt-claims disk ${health.disk.free_gb} of ${health.disk.total_gb} GB free. `
          : ""}
        Claims API heap {health.memory.used} of {health.memory.total} MB. Read
        once when this page opened; the header dot re-checks every 30 seconds.
      </p>
    </div>
  )
}
