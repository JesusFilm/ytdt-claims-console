"use client"

import { useState } from "react"

import { Check, Link2 } from "lucide-react"

/**
 * Copies a link to one entry, for pasting to someone else.
 *
 * The console already opens on a specific run via ?run=<id> — it just never
 * offered the address, so sharing one meant describing it by timestamp.
 */
export default function ShareLink({
  id,
  label = "Copy link to this run",
}: {
  id: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = `${window.location.origin}/?run=${encodeURIComponent(id)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard refused (an insecure origin, or permission denied): show the
      // address so it can still be copied by hand rather than failing silently
      window.prompt("Copy this link", url)
    }
  }

  return (
    <button
      onClick={copy}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title={copied ? "Link copied" : label}
      aria-label={copied ? "Link copied" : label}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Link2 className="w-4 h-4" />
      )}
    </button>
  )
}
