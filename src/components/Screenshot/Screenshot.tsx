"use client"

import { useState } from "react"

import Image from "next/image"

/**
 * A screenshot that can be opened full size.
 *
 * Help images are cropped to the part that matters, which makes them small on
 * a phone. Tapping one opens it over the page; tapping again closes it. No
 * library: a dialog, an Escape key, and a click anywhere to dismiss.
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
          className="block w-full cursor-zoom-in"
          aria-label={`${alt} — open larger`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="rounded-lg border border-gray-200 w-full h-auto"
          />
        </button>
        <figcaption className="text-xs text-gray-500 mt-1">
          {alt} <span className="text-gray-400">· tap to enlarge</span>
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
          className="fixed inset-0 z-50 bg-black/70 p-4 overflow-auto cursor-zoom-out flex items-center justify-center"
        >
          <Image
            src={src}
            alt={alt}
            width={width * 2}
            height={height * 2}
            className="rounded-lg max-w-none w-auto"
            style={{ maxHeight: "none" }}
          />
        </div>
      )}
    </>
  )
}
