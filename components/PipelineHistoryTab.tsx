import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import RunCard from './RunCard';
import RunDetailsModal from './RunDetailsModal';
import type { PipelineRun } from '@/types/PipelineRun';

interface PipelineHistoryProps {
  runs: PipelineRun[];
  onRetry?: (runId: string) => void;
  onDownload?: (runId: string) => void;
  className?: string;
}

export default function PipelineHistory({
  runs,
  onRetry,
  onDownload,
  className = ''
}: PipelineHistoryProps) {
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  const getStats = () => {
    const total = runs.length;
    const successful = runs.filter(r => r.status === 'completed').length;
    const failed = runs.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    return { total, successful, failed, successRate };
  };

  const downloadInvalidMCIDs = (runId: string, type: 'mcn' | 'jfm') => {
    const run = runs.find(r => r.id === runId);
    if (!run?.results) return;

    const invalidMCIDs = type === 'mcn' 
      ? run.results.mcnVerdicts?.invalidMCIDs 
      : run.results.jfmVerdicts?.invalidMCIDs;

    if (!invalidMCIDs?.length) return;

    // Generate CSV content
    const csvContent = [
      'media_component_id',
      ...invalidMCIDs
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invalid-mcids-${type}-${runId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = getStats();

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline History</h2>
          <p className="text-gray-600 mt-1">Track all your pipeline runs and results</p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{stats.total}</p>
            <p className="text-gray-500">Total runs</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-green-600">{stats.successRate}%</p>
            <p className="text-gray-500">Success rate</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{stats.successful}</p>
              <p className="text-sm text-gray-500">Successful runs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed runs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {runs.length > 0 ? Math.round(runs.reduce((sum, run) => sum + (run.duration || 0), 0) / runs.length / 1000 / 60) : 0}m
              </p>
              <p className="text-sm text-gray-500">Avg duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Run History */}
      <div className="space-y-4">
        {runs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pipeline runs yet</h3>
            <p className="text-gray-600">Upload some files and run your first pipeline to see history here</p>
          </div>
        ) : (
          runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onRetry={onRetry}
              onDownload={onDownload}
              onViewDetails={setSelectedRun}
              onDownloadInvalidMCIDs={downloadInvalidMCIDs}
            />
          ))
        )}
      </div>

      {/* Run Details Modal */}
      {selectedRun && (
        <RunDetailsModal
          run={selectedRun}
          isOpen={!!selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </div>
  );
}