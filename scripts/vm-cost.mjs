#!/usr/bin/env node
// Regenerates data/infra-cost.json — the figures behind /costs.
//
// Run it by hand after the VMs change (resize, new disk, new instance):
//   node scripts/vm-cost.mjs
//
// It needs gcloud logged in as someone with compute read access on the
// project. The service account the pipeline runs as does NOT have that, which
// is why this is a committed snapshot rather than a live call from the app.
//
// Everything here is LIST PRICE for a VM running continuously. It is not
// measured usage and it carries no sustained-use discount. See /costs for the
// method, written out for the reader.

import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"

const ZONE = process.env.ZONE || "us-east1-b"
const REGION = ZONE.slice(0, ZONE.lastIndexOf("-"))
const VM_FILTER = process.env.VM_FILTER || "labels.stack=analytics"
const COMPUTE_ENGINE_SERVICE = "6F81-5844-456A"
const HOURS_PER_MONTH = 730 // Google's own convention for monthly pricing
const DAYS_PER_MONTH = 30.44

// E2 shared-core machines report 2 guest CPUs but bill at a fraction of one.
const SHARED_CORE_VCPU = { "e2-micro": 0.25, "e2-small": 0.5, "e2-medium": 1 }

const gcloud = (args) =>
  JSON.parse(
    execFileSync("gcloud", [...args, "--format", "json"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }) || "[]"
  )

async function skuRates() {
  const token = execFileSync("gcloud", ["auth", "print-access-token"], {
    encoding: "utf8",
  }).trim()
  const rates = new Map()
  let pageToken
  do {
    const url = new URL(
      `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_ENGINE_SERVICE}/skus`
    )
    url.searchParams.set("pageSize", "5000")
    url.searchParams.set("currencyCode", "USD")
    if (pageToken) url.searchParams.set("pageToken", pageToken)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok)
      throw new Error(`Billing catalog: ${res.status} ${await res.text()}`)
    const page = await res.json()
    for (const sku of page.skus || []) {
      if (!sku.serviceRegions?.includes(REGION)) continue
      if (rates.has(sku.description)) continue
      const tier =
        sku.pricingInfo?.[0]?.pricingExpression?.tieredRates?.at(-1)?.unitPrice
      if (!tier) continue
      rates.set(
        sku.description,
        Number(tier.units || 0) + (tier.nanos || 0) / 1e9
      )
    }
    pageToken = page.nextPageToken
  } while (pageToken)
  return rates
}

const rateOf = (rates, description) => {
  const rate = rates.get(description)
  if (rate === undefined) {
    throw new Error(`No price for "${description}" in ${REGION}`)
  }
  return rate
}

const rates = await skuRates()
const diskRate = {
  "pd-standard": rateOf(rates, "Storage PD Capacity"),
  "pd-balanced": rateOf(rates, "Balanced PD Capacity"),
  "pd-ssd": rateOf(rates, "SSD backed PD Capacity"),
}
const coreRate = rateOf(rates, "E2 Instance Core running in Americas")
const ramRate = rateOf(rates, "E2 Instance Ram running in Americas")

const disks = new Map(
  gcloud(["compute", "disks", "list", "--filter", `zone:${ZONE}`]).map((d) => [
    d.name,
    d,
  ])
)

const instances = gcloud([
  "compute",
  "instances",
  "list",
  "--filter",
  VM_FILTER,
])
  .map((vm) => {
    const machineType = vm.machineType.split("/").pop()
    const spec = gcloud([
      "compute",
      "machine-types",
      "describe",
      machineType,
      "--zone",
      ZONE,
    ])
    const ramGib = spec.memoryMb / 1024
    const vcpu = SHARED_CORE_VCPU[machineType] ?? spec.guestCpus
    const computeHourly = vcpu * coreRate + ramGib * ramRate
    const attached = (vm.disks || [])
      .map((d) => disks.get(d.source?.split("/").pop()))
      .filter(Boolean)
      .map((d) => {
        const type = d.type.split("/").pop()
        const sizeGb = Number(d.sizeGb)
        return {
          type,
          sizeGb,
          rate: diskRate[type],
          monthly: sizeGb * diskRate[type],
        }
      })
    const diskMonthly = attached.reduce((sum, d) => sum + d.monthly, 0)
    const monthly = computeHourly * HOURS_PER_MONTH + diskMonthly
    return {
      name: vm.name,
      system: vm.labels?.system ?? "unlabelled",
      role: vm.labels?.role ?? null,
      machineType,
      guestCpus: spec.guestCpus,
      vcpu,
      sharedCore: machineType in SHARED_CORE_VCPU,
      ramGib,
      computeHourly,
      computeMonthly: computeHourly * HOURS_PER_MONTH,
      disks: attached,
      diskMonthly,
      monthly,
      daily: monthly / DAYS_PER_MONTH,
    }
  })
  .sort((a, b) => b.monthly - a.monthly)

const out = {
  generatedAt: new Date().toISOString(),
  zone: ZONE,
  region: REGION,
  filter: VM_FILTER,
  hoursPerMonth: HOURS_PER_MONTH,
  daysPerMonth: DAYS_PER_MONTH,
  rates: { core: coreRate, ram: ramRate, disk: diskRate },
  instances,
}
writeFileSync("data/infra-cost.json", `${JSON.stringify(out, null, 2)}\n`)
console.log(
  `data/infra-cost.json — ${instances.length} instances, $${instances
    .reduce((s, i) => s + i.daily, 0)
    .toFixed(2)}/day list`
)
