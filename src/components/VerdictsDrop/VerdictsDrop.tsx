"use client"

import { useCallback } from "react"

import { Upload, FileText, X, AlertTriangle, Loader2 } from "lucide-react"
import { FileRejection, useDropzone } from "react-dropzone"

/**
 * One box for the verdicts, however many there are.
 *
 * There used to be two, MCN and JFM, and the person had to know which was
 * which. Nothing on the file says so — both carry the same seven columns — so
 * the pipeline decides it from the share of video ids we own, and this shows
 * what it decided. When it cannot tell, the file waits here for an answer
 * rather than going into a box on a guess.
 */

export interface VerdictFile {
  file: File
  /** "mcn" | "jfm" once placed, null while the pipeline is still deciding */
  side: "mcn" | "jfm" | null
  /** Why it is not placed: unsure, a claims file, an unreadable one */
  problem: string | null
  rows: number | null
  /** Share of these videos that are ours, as the pipeline measured it */
  ratio: number | null
  /** The person overrode the pipeline's answer */
  manual: boolean
}

interface VerdictsDropProps {
  verdicts: VerdictFile[]
  classifying: boolean
  disabled?: boolean
  onDrop: (files: File[]) => void
  onAssign: (name: string, side: "mcn" | "jfm") => void
  onRemove: (name: string) => void
}

const SIDE_LABEL = { mcn: "MCN verdicts", jfm: "JFM verdicts" } as const

export default function VerdictsDrop({
  verdicts,
  classifying,
  disabled = false,
  onDrop,
  onAssign,
  onRemove,
}: VerdictsDropProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (disabled) return
      if (rejectedFiles.length > 0) {
        alert(`File rejected: ${rejectedFiles[0].errors[0].message}`)
        return
      }
      if (acceptedFiles.length > 0) onDrop(acceptedFiles)
    },
    [onDrop, disabled]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: handleDrop,
      accept: { "text/csv": [".csv"] },
      maxFiles: 4,
      multiple: true,
      disabled: disabled || classifying,
    })

  const dragStyles = () => {
    if (disabled || classifying) return "opacity-60 cursor-not-allowed"
    if (isDragReject) return "border-red-300 bg-red-50"
    if (isDragActive) return "border-blue-400 bg-blue-100"
    if (verdicts.length) return "border-green-300 bg-green-50"
    return "border-blue-200 hover:border-blue-300 bg-white"
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${dragStyles()}`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {classifying ? (
            <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-600" />
          )}
        </div>
        <p className="text-base font-medium text-gray-900">
          {classifying
            ? "Reading the files…"
            : isDragActive
              ? "Drop the verdicts here"
              : "Drop the verdicts CSV"}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          One file or both. Which is MCN and which is JFM is worked out for you.
        </p>
      </div>

      {verdicts.length > 0 && (
        <ul className="space-y-2">
          {verdicts.map((v) => (
            <li
              key={v.file.name}
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                v.side
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {v.side ? (
                <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  {v.file.name}
                </p>
                {v.side ? (
                  <p className="text-xs text-gray-600">
                    {SIDE_LABEL[v.side]}
                    {v.rows !== null && ` · ${v.rows.toLocaleString()} rows`}
                    {v.manual
                      ? " · you placed this"
                      : v.ratio !== null &&
                        ` · ${Math.round(v.ratio * 100)}% of these videos are ours`}
                  </p>
                ) : (
                  <p className="text-xs text-amber-800">{v.problem}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={v.side ?? ""}
                  onChange={(e) =>
                    onAssign(v.file.name, e.target.value as "mcn" | "jfm")
                  }
                  disabled={disabled}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
                  aria-label={`Which verdicts is ${v.file.name}?`}
                >
                  <option value="" disabled>
                    Not placed
                  </option>
                  <option value="mcn">MCN</option>
                  <option value="jfm">JFM</option>
                </select>
                <button
                  onClick={() => onRemove(v.file.name)}
                  disabled={disabled}
                  className="p-1 rounded-full hover:bg-white transition-colors"
                  aria-label={`Remove ${v.file.name}`}
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
