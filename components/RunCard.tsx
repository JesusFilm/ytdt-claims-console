import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  RotateCcw,
  Eye
} from 'lucide-react';

import ResultsSummary from './ResultsSummary';
import type { PipelineRun } from '@/types/PipelineRun';
import { formatTimestamp } from '@/utils/formatTime';


const StatusIcon: React.FC<{ status: PipelineRun['status'] }> = ({ status }) => {
  const iconProps = { className: "w-5 h-5" };

  switch (status) {
    case 'completed':
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
    case 'running':
      return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    case 'failed':
      return <AlertCircle {...iconProps} className="w-5 h-5 text-red-600" />;
    case 'cancelled':
      return <Clock {...iconProps} className="w-5 h-5 text-gray-500" />;
    case 'timeout':
      return <Clock {...iconProps} className="w-5 h-5 text-orange-600" />;
    default:
      return <Clock {...iconProps} className="w-5 h-5 text-gray-400" />;
  }
};

const StatusBadge: React.FC<{ status: PipelineRun['status'] }> = ({ status }) => {
  const styles = {
    running: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    timeout: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface RunCardProps {
  run: PipelineRun;
  onRetry?: (runId: string) => void;
  onDownload?: (runId: string) => void;
  onViewDetails?: (run: PipelineRun) => void;
  onDownloadInvalidMCIDs?: (runId: string, type: 'mcn' | 'jfm') => void;
}

export default function RunCard({
  run,
  onRetry,
  onDownload,
  onViewDetails,
  onDownloadInvalidMCIDs
}: RunCardProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const cardBg = run.status === 'failed' ? 'bg-red-50 border-red-200' :
    run.status === 'running' ? 'bg-blue-50 border-blue-200' :
      'bg-white border-gray-200';

  return (
    <div className={`border rounded-2xl p-6 transition-all hover:shadow-md ${cardBg}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <StatusIcon status={run.status} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900">{formatTimestamp(run.startTime)}</h3>
              <StatusBadge status={run.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              {run.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(run.duration)}
                </span>
              )}

              {run.status === 'running' && (
                <span className="flex items-center gap-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  In progress...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails && onViewDetails(run)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {run.status === 'completed' && onDownload && (
            <button
              onClick={() => onDownload(run.id)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download exports"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {(run.status === 'failed' || run.status === 'timeout') && onRetry && (
            <button
              onClick={() => onRetry(run.id)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Retry pipeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {run.error && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700 font-medium">Error Details</p>
          <p className="text-sm text-red-600 mt-1">{run.error}</p>
        </div>
      )}

      {/* Results Summary */}
      {run.results && run.status === 'completed' && (
        <ResultsSummary
          results={run.results}
          runId={run.id}
          onDownloadInvalidMCIDs={onDownloadInvalidMCIDs}
        />
      )}
    </div>
  );
}