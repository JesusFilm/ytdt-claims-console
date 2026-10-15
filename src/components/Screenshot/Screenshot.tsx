"use client"

import { useState } from "react"

import Image from "next/image"

/**
 * A screenshot drawn at half its captured size, enlargeable on click.
 *
 * The captures come from the browser's region zoom, so they hold about 2.3x the
 * pixels of the CSS layout. Drawn at half width they are sharp on a retina
 * screen; clicking shows them at full captured size, which is a real zoom
 * rather than an upscale of a 1x grab.
 */
export default function Screenshot({
  src,
  alt,
  width,
  height,
}: {
  src: string
  alt: string
  width: number
  height: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <figure className="my-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block cursor-zoom-in"
          style={{ maxWidth: Math.round(width / 2) }}
          aria-label={`${alt} — open larger`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            quality={95}
            className="rounded-lg border border-gray-200 w-full h-auto"
          />
        </button>
        <figcaption className="text-xs text-gray-500 mt-1">
          {alt} <span className="text-gray-400">· click to enlarge</span>
        </figcaption>
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false)
          }}
          ref={(node) => node?.focus()}
          className="fixed inset-0 z-50 bg-black/80 overflow-auto cursor-zoom-out p-4"
        >
          {/* twice captured size, and allowed to overflow: the point is to see
              it bigger, not to fit it on the screen */}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            quality={100}
            className="rounded-lg mx-auto max-w-none"
            style={{ width, height: "auto" }}
          />
        </div>
      )}
    </>
  )
}
