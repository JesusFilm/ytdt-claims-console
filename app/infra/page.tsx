import infra from "../../data/infra-cost.json"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Infrastructure — YouTube Claims Pipeline",
  robots: "noindex",
}

const BILLING_REPORT =
  "https://console.cloud.google.com/billing/01D99C-E73B52-6D409C/reports"

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function InfraPage() {
  const { instances, rates, hoursPerMonth, daysPerMonth, region } = infra
  const monthly = instances.reduce((sum, vm) => sum + vm.monthly, 0)

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Infrastructure</h1>
        <p className="text-gray-600">
          List price for the machines, running continuously. Group the{" "}
          <a
            href={BILLING_REPORT}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            billing report →
          </a>{" "}
          by the <code className="text-gray-900">system</code> label for what
          was actually charged.
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Machine</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Label</th>
            <th className="py-2 pr-4 font-medium text-right">Per day</th>
            <th className="py-2 font-medium text-right">Per month</th>
          </tr>
        </thead>
        <tbody>
          {instances.map((vm) => (
            <tr key={vm.name} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium text-gray-900">{vm.name}</td>
              <td className="py-2 pr-4 text-gray-600">
                {vm.machineType}
                <span className="text-gray-400">
                  {" "}
                  + {vm.disks.reduce((sum, d) => sum + d.sizeGb, 0)} GiB
                </span>
              </td>
              <td className="py-2 pr-4">
                <code className="text-gray-600">system={vm.system}</code>
              </td>
              <td className="py-2 pr-4 text-right text-gray-900">
                {usd(vm.daily)}
              </td>
              <td className="py-2 text-right text-gray-900">
                {usd(vm.monthly)}
              </td>
            </tr>
          ))}
          <tr className="font-medium text-gray-900">
            <td className="py-2 pr-4" colSpan={3}>
              Total
            </td>
            <td className="py-2 pr-4 text-right">
              {usd(monthly / daysPerMonth)}
            </td>
            <td className="py-2 text-right">{usd(monthly)}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-500">
        ({rates.core.toFixed(9)} × vCPU + {rates.ram.toFixed(9)} × GiB RAM) ×{" "}
        {hoursPerMonth}h + disk GiB × {usd(rates.disk["pd-standard"])} standard
        or {usd(rates.disk["pd-balanced"])} balanced, per month. {region} rates
        from Google&apos;s price catalogue, read{" "}
        {new Date(infra.generatedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        .
      </p>
    </main>
  )
}
