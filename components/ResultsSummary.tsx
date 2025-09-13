import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Download
} from 'lucide-react';
import type { PipelineRun } from '../types/PipelineRun';

interface ResultsSummaryProps {
  results: PipelineRun['results'];
  runId: string;
  className?: string;
  onDownloadInvalidMCIDs?: (runId: string, type: 'mcn' | 'jfm') => void;
}

export default function ResultsSummary({
  results,
  runId,
  className = '',
  onDownloadInvalidMCIDs
}: ResultsSummaryProps) {
  if (!results) return null;

  const getTotalInvalidMCIDs = () => {
    const mcnCount = results.mcnVerdicts?.invalidMCIDs?.length || 0;
    const jfmCount = results.jfmVerdicts?.invalidMCIDs?.length || 0;
    return mcnCount + jfmCount;
  };

  const handleDownloadMCIDs = () => {
    if (!onDownloadInvalidMCIDs) return;

    // Download MCN if available, otherwise JFM
    if (results.mcnVerdicts?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, 'mcn');
    } else if (results.jfmVerdicts?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, 'jfm');
    }
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {results.claimsProcessed && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Claims</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {results.claimsProcessed.new.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">new</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {results.claimsProcessed.total.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </div>
      )}

      {(results.mcnVerdicts || results.jfmVerdicts) && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Verdicts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {((results.mcnVerdicts?.processed || 0) + (results.jfmVerdicts?.processed || 0)).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">processed</span>
          </div>
        </div>
      )}

      {results.exports && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Exports</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {Object.keys(results.exports).length}
            </span>
            <span className="text-xs text-gray-500">files</span>
          </div>
        </div>
      )}

      {getTotalInvalidMCIDs() > 0 && (
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Issues</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-orange-600">
              {getTotalInvalidMCIDs()}
            </span>
            <span className="text-xs text-orange-500">
              {onDownloadInvalidMCIDs && (
                <button
                  onClick={handleDownloadMCIDs}
                  className="flex items-center gap-1 mt-2 text-xs text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                >
                  <Download className="w-3 h-3" />
                  invalid MCIDs
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}