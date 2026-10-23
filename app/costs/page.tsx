import Link from "next/link"

import costs from "../../data/infra-cost.json"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Infrastructure cost — YouTube Claims Pipeline",
  robots: "noindex",
}

const BILLING_REPORT =
  "https://console.cloud.google.com/billing/01D99C-E73B52-6D409C/reports"

const usd = (n: number, digits = 2) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

const SYSTEM_LABEL: Record<string, string> = {
  ytdt: "This pipeline",
  "data-platform": "Shared data platform",
}

export default function CostsPage() {
  const { instances, rates, hoursPerMonth, daysPerMonth, region } = costs

  const totals = new Map<string, number>()
  for (const vm of instances) {
    totals.set(vm.system, (totals.get(vm.system) ?? 0) + vm.monthly)
  }
  const grandMonthly = instances.reduce((sum, vm) => sum + vm.monthly, 0)

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600">
          YouTube Claims Pipeline
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          What the machines cost
        </h1>
        <p className="text-gray-600">
          An estimate for the three virtual machines behind this pipeline, at
          Google&apos;s published list prices. It is not your invoice — see{" "}
          <a href="#not-your-bill" className="text-blue-600 underline">
            why the two differ
          </a>
          .
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Per machine</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Machine</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium text-right">vCPU</th>
                <th className="py-2 pr-4 font-medium text-right">RAM</th>
                <th className="py-2 pr-4 font-medium text-right">Disk</th>
                <th className="py-2 pr-4 font-medium text-right">Per day</th>
                <th className="py-2 font-medium text-right">Per month</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((vm) => (
                <tr key={vm.name} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {vm.name}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{vm.machineType}</td>
                  <td className="py-2 pr-4 text-right text-gray-700">
                    {vm.vcpu}
                    {vm.sharedCore && (
                      <span className="text-gray-400"> of {vm.guestCpus}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-700">
                    {vm.ramGib} GiB
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-700">
                    {vm.disks
                      .map(
                        (d) => `${d.sizeGb} GiB ${d.type.replace("pd-", "")}`
                      )
                      .join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-900">
                    {usd(vm.daily)}
                  </td>
                  <td className="py-2 text-right text-gray-900">
                    {usd(vm.monthly)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">By system</h2>
        <p className="text-gray-700">
          The <code className="text-gray-900">system</code> label on each
          machine splits the bill. The shared data platform is not charged to
          this pipeline, because Airbyte serves more than YouTube.
        </p>
        <ul className="space-y-1 text-gray-700">
          {[...totals.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([system, monthly]) => (
              <li key={system}>
                <span className="font-medium text-gray-900">
                  {SYSTEM_LABEL[system] ?? system}
                </span>{" "}
                <span className="text-gray-500">({system})</span> —{" "}
                {usd(monthly / daysPerMonth)} per day, {usd(monthly)} per month
              </li>
            ))}
          <li className="pt-1 border-t border-gray-100">
            <span className="font-medium text-gray-900">All three</span> —{" "}
            {usd(grandMonthly / daysPerMonth)} per day, {usd(grandMonthly)} per
            month
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">
          How the figures are worked out
        </h2>
        <p className="text-gray-700">
          Each machine is priced on what it is, not on what it did. Google
          charges for CPU and memory separately, by the hour:
        </p>
        <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-800">
          {`per hour  = vCPU × ${rates.core.toFixed(9)}  +  RAM GiB × ${rates.ram.toFixed(9)}
per month = per hour × ${hoursPerMonth}  +  disk GiB × disk rate
per day   = per month ÷ ${daysPerMonth}

disk rates   standard ${usd(rates.disk["pd-standard"], 2)}/GiB/month   balanced ${usd(rates.disk["pd-balanced"], 2)}/GiB/month`}
        </pre>
        <p className="text-gray-700">
          The rates come from Google&apos;s Cloud Billing price catalogue for{" "}
          <span className="font-medium text-gray-900">{region}</span>, read
          directly rather than typed in by hand.{" "}
          <span className="font-medium text-gray-900">
            {hoursPerMonth} hours
          </span>{" "}
          is Google&apos;s own convention for a month, and {daysPerMonth} days
          turns that back into a daily figure.
        </p>
        <p className="text-gray-700">
          One number is an assumption rather than a published rate. The small
          machine reports two CPUs but is a shared-core type, which Google bills
          at half a vCPU. The table shows both, as{" "}
          <span className="whitespace-nowrap">&ldquo;0.5 of 2&rdquo;</span>.
        </p>
      </section>

      <section id="not-your-bill" className="space-y-3 scroll-mt-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Why this is not your bill
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-gray-700">
          <li>
            <span className="font-medium text-gray-900">
              It assumes the machines never stop.
            </span>{" "}
            Every figure is for a machine running continuously. Stop one and
            your bill falls; this page will not notice.
          </li>
          <li>
            <span className="font-medium text-gray-900">
              It is list price, before discounts.
            </span>{" "}
            Google applies a sustained-use discount automatically to machines
            that run most of a month, so the real figure is lower.
          </li>
          <li>
            <span className="font-medium text-gray-900">
              It covers machines and their disks only.
            </span>{" "}
            Network traffic out of Google, snapshots, external addresses and
            every other service are not counted.
          </li>
        </ul>
        <p className="text-gray-700">
          For what you were actually charged, open the{" "}
          <a
            href={BILLING_REPORT}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            billing report
          </a>{" "}
          and group by the <code className="text-gray-900">system</code> label.
          One caveat there: labels are not retroactive. Google applies them from
          the moment they are set, so months before October 2026 show no label
          at all and are left out of a label-filtered report.
        </p>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-400">
        Figures generated{" "}
        {new Date(costs.generatedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}{" "}
        from the live machines. They change only when the machines do — re-run{" "}
        <code>node scripts/vm-cost.mjs</code> after a resize.{" "}
        <Link href="/help" className="text-blue-600 underline">
          Back to help
        </Link>
      </footer>
    </main>
  )
}
