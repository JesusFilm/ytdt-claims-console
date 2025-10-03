'use client';

import React from 'react';
import { PlayCircle, Pause } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { formatRunFiles } from '@/utils/formatFiles';

interface FileState {
  claims: File | null;
  mcnVerdicts: File | null;
  jfmVerdicts: File | null;
}

interface UploadTabProps {
  files: FileState;
  claimsSource: string;
  isRunning: boolean;
  loading: boolean;
  handleFileDrop: (acceptedFiles: File[], fileType: keyof FileState) => void;
  handleFileRemove: (fileType: keyof FileState) => void;
  setClaimsSource: (source: string) => void;
  handleRunPipeline: () => void;
  handleReset: () => void;
}

export default function UploadTab({
  files,
  claimsSource,
  isRunning,
  loading,
  handleFileDrop,
  handleFileRemove,
  setClaimsSource,
  handleRunPipeline,
  handleReset
}: UploadTabProps) {
  const hasFiles = files.claims || files.mcnVerdicts || files.jfmVerdicts;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Process YouTube MCN Claims
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your claims reports and verdict files to automatically process
          YouTube Multi-Channel Network data through our secure pipeline.
        </p>
      </div>

      {/* File Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <FileUpload
          file={files.claims}
          onDrop={(files) => handleFileDrop(files, 'claims')}
          onRemove={() => handleFileRemove('claims')}
          title="Claims Report"
          description="Latest MCN claims CSV from YouTube Studio"
          disabled={isRunning}
        />

        <FileUpload
          file={files.mcnVerdicts}
          onDrop={(files) => handleFileDrop(files, 'mcnVerdicts')}
          onRemove={() => handleFileRemove('mcnVerdicts')}
          title="MCN Verdicts"
          description="Verdict decisions for MCN claims"
          disabled={isRunning}
        />

        <FileUpload
          file={files.jfmVerdicts}
          onDrop={(files) => handleFileDrop(files, 'jfmVerdicts')}
          onRemove={() => handleFileRemove('jfmVerdicts')}
          title="JFM Verdicts"
          description="Verdict decisions for owned channel videos"
          disabled={isRunning}
        />
      </div>

      {/* Claims Source Selection */}
      {files.claims && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Source</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="claimsSource"
                value="matter_entertainment"
                checked={claimsSource === 'matter_entertainment'}
                onChange={(e) => setClaimsSource(e.target.value)}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Matter Entertainment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="claimsSource"
                value="matter_2"
                checked={claimsSource === 'matter_2'}
                onChange={(e) => setClaimsSource(e.target.value)}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Matter 2</span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          disabled={isRunning}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset Files
        </button>

        <button
          onClick={handleRunPipeline}
          disabled={isRunning || !hasFiles}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting Pipeline...
            </>
          ) : isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pipeline Running
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Run Pipeline
            </>
          )}
        </button>
      </div>

      {/* File Summary */}
      {hasFiles && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Ready to Process</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {formatRunFiles(files, true).map(file => <p key={file}>• {file}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}