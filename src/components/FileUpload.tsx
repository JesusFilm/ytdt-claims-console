"use client"

import React, { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, CheckCircle, FileText, X } from "lucide-react"

interface FileUploadProps {
  file: File | null
  onDrop: (files: File[]) => void
  onRemove?: () => void
  title: string
  description: string
  disabled?: boolean
  maxSize?: number
  className?: string
}

export default function FileUpload({
  file,
  onDrop,
  onRemove,
  title,
  description,
  disabled = false,
  maxSize = 1024 * 1024 * 1000, // 1GB
  className = "",
}: FileUploadProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled) return

      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        alert(`File rejected: ${error.message}`)
        return
      }

      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles)
      }
    },
    [onDrop, disabled]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: handleDrop,
      accept: { "text/csv": [".csv"] },
      maxFiles: 1,
      maxSize,
      multiple: false,
      disabled,
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getDragStyles = () => {
    if (disabled) return "opacity-50 cursor-not-allowed"
    if (isDragReject) return "border-red-300 bg-red-50"
    if (isDragActive) return "border-blue-400 bg-blue-50"
    if (file) return "border-green-300 bg-green-50"
    return "border-gray-200 hover:border-gray-300 bg-white"
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer 
          transition-all duration-200 ${getDragStyles()}
        `}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Uploaded {new Date().toLocaleTimeString()}
              </p>
            </div>
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="absolute top-3 right-3 p-1 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-900">
                {isDragActive ? "Drop your CSV file here" : "Upload CSV file"}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
