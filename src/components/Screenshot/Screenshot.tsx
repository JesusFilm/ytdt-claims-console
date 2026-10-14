"use client"

import { useState } from "react"

import Image from "next/image"

/**
 * A screenshot shown at its true size, enlargeable on click.
 *
 * It used to stretch to the column width — a 620px crop drawn at 1456px, which
 * is why the text looked soft. Now it is never drawn larger than it was
 * captured; clicking opens it at twice that, scrollable, which is what someone
 * on a phone needs.
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
          style={{ maxWidth: width }}
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
            width={width * 2}
            height={height * 2}
            quality={100}
            className="rounded-lg mx-auto max-w-none"
            style={{ width: width * 2, height: "auto" }}
          />
        </div>
      )}
    </>
  )
}
