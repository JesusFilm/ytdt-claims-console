import { FileText, Download } from "lucide-react"

import { env } from "@/env"
import type { PipelineRun } from "@/types/PipelineRun"

interface UploadedFilesSectionProps {
  files: PipelineRun["files"]
}

interface FileItemProps {
  label: string
  filePath: string
  source?: string
}

function FileItem({ label, filePath, source }: FileItemProps) {
  const filename = filePath.split("/").pop()

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">
            {filePath} {source && `(${source})`}
          </p>
        </div>
      </div>
      <button
        onClick={() =>
          window.open(
            `${env.NEXT_PUBLIC_API_URL}/api/uploads/${filename}`,
            "_blank"
          )
        }
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title={`Download ${label.toLowerCase()} file`}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function UploadedFilesSection({
  files,
}: UploadedFilesSectionProps) {
  const hasFiles =
    files.claims_matter_entertainment ||
    files.claims_matter_2 ||
    files.mcnVerdicts ||
    files.jfmVerdicts

  if (!hasFiles) return null

  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
      <div className="space-y-2">
        {files.claims_matter_entertainment && (
          <FileItem
            label="Claims (Matter Entertainment)"
            filePath={files.claims_matter_entertainment}
          />
        )}
        {files.claims_matter_2 && (
          <FileItem
            label="Claims (Matter 2)"
            filePath={files.claims_matter_2}
          />
        )}
        {files.mcnVerdicts && (
          <FileItem label="MCN Verdicts" filePath={files.mcnVerdicts} />
        )}
        {files.jfmVerdicts && (
          <FileItem label="JFM Verdicts" filePath={files.jfmVerdicts} />
        )}
      </div>
    </div>
  )
}
