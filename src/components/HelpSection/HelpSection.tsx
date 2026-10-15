"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A help section that starts closed and opens when linked to.
 *
 * The page is a glossary — eighteen terms is a wall of text for someone who
 * came to answer one question. Sections are collapsed by default, except the
 * one holding the anchor in the URL, so following "Claims as of" from the
 * dashboard still lands on an open paragraph.
 */
export default function HelpSection({
  title,
  anchors,
  children,
}: {
  title: string
  anchors: string[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const openIfTargeted = () => {
      const hash = window.location.hash.slice(1)
      if (hash && anchors.includes(hash)) {
        setOpen(true)
        // the browser scrolled before this section existed on screen
        requestAnimationFrame(() =>
          document.getElementById(hash)?.scrollIntoView({ block: "center" })
        )
      }
    }
    openIfTargeted()
    window.addEventListener("hashchange", openIfTargeted)
    return () => window.removeEventListener("hashchange", openIfTargeted)
  }, [anchors])

  return (
    <details
      ref={ref}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="border-b border-gray-200 pb-3"
    >
      <summary className="cursor-pointer list-none flex items-center gap-2 py-2">
        <span className="text-gray-400 text-sm transition-transform details-open:rotate-90">
          ▸
        </span>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </summary>
      <div className="space-y-6 pt-2 pl-5">{children}</div>
    </details>
  )
}
