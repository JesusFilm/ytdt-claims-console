import { authFetch } from "@/utils/auth"
import { Database, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { env } from "@/env"

export default function ExportedFilesSection({ runId }: { runId: string }) {
  const [exportedFiles, setExportedFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExportedFiles = async () => {
      try {
        const response = await authFetch(`/api/exports/run/${runId}`)
        const data = await response.json()
        setExportedFiles(data.files || [])
      } catch (error) {
        console.error("Failed to fetch exported files:", error)
        setExportedFiles([])
      } finally {
        setLoading(false)
      }
    }

    fetchExportedFiles()
  }, [runId])

  if (loading) {
    return (
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Exported Files</h4>
        <p className="text-sm text-gray-500">Loading exported files...</p>
      </div>
    )
  }

  if (exportedFiles.length === 0) {
    return (
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Exported Files</h4>
        <p className="text-sm text-gray-500">No exported files found</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 mb-3">Exported Files</h4>
      <div className="space-y-2">
        {exportedFiles.map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB •{" "}
                  {new Date(file.modified).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const link = document.createElement("a")
                link.href = `${env.NEXT_PUBLIC_API_URL}/api/exports/run/${runId}/${file.name}`
                link.download = file.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Download ${file.name}`}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
