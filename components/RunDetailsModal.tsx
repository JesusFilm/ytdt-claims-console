import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import PipelineSteps, { PipelineStep } from './PipelineSteps';
import type { PipelineRun } from '@/types/PipelineRun';
import ProcessedFilesSection from './ProcessedFilesSection';
import UploadedFilesSection from './UploadedFilesSection';

interface RunDetailsModalProps {
  run: PipelineRun;
  isOpen: boolean;
  onClose: () => void;
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

const formatTimestamp = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};

const formatStepName = (stepId: string) => {
  return stepId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function RunDetailsModal({ run, isOpen, onClose }: RunDetailsModalProps) {
  if (!isOpen) return null;

  // Convert backend startedSteps to PipelineStep format
  const steps: PipelineStep[] = run.startedSteps.map(step => ({
    id: step.name,
    name: formatStepName(step.name),
    status: step.status,
    duration: step.duration,
    error: step.error || undefined
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Pipeline Run Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatTimestamp(run.startTime)}
                  {run.duration && (
                    <span className="ml-2">• Duration: {formatDuration(run.duration)}</span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">

            {/* Input Files - downloadable */}
            <UploadedFilesSection files={run.files} />

            {/* Processed Files - downloadable */}
            <ProcessedFilesSection runId={run.id} />

            {/* Error */}
            {run.error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900">Pipeline Failed</h4>
                    <p className="text-red-700 mt-1 text-sm">{run.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Steps */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Pipeline Steps</h4>
              <PipelineSteps
                steps={steps}
                compact={true}
                className="border-0"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}