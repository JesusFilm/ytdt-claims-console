import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import RefreshButton from './RefreshButton';
import PipelineSteps, { PipelineStep } from './PipelineSteps';
import { PipelineRun } from '@/types/PipelineRun';
import { formatDuration } from '@/utils/formatTime';


export interface PipelineStatusProps {
  status: {
    running: boolean;
    status: string;
    error: string | null;
    progress?: number;
    steps: PipelineStep[];
    currentStep?: string;
    startTime?: Date;
    lastRun?: PipelineRun
  };
  onRefresh?: () => Promise<void>;
}

const StatusBadge: React.FC<{ status: string; running: boolean }> = ({ status, running }) => {
  if (running) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Processing
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Completed
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        Failed
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" />
        Timed Out
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
      <Clock className="w-4 h-4" />
      Idle
    </div>
  );
};


export default function PipelineStatusTab({ status, onRefresh }: PipelineStatusProps) {

  const showIdleState = !status.running;

  const getProgress = () => {
    if (status.progress !== undefined) return status.progress;
    if (!status.steps) return 0;
    const completed = status.steps.filter(s => s.status === 'completed').length;
    return (completed / status.steps.length) * 100;
  };

  const getCurrentStepInfo = () => {
    if (!status.running || !status.steps) return null;
    const runningStep = status.steps.find(s => s.status === 'running');
    const completedCount = status.steps.filter(s => s.status === 'completed').length;

    return {
      current: runningStep?.name || status.currentStep,
      step: completedCount + 1,
      total: status.steps.length
    };
  };

  const currentStep = getCurrentStepInfo();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline Status</h2>
          <p className="text-gray-600 mt-1">
            {status.running
              ? `Processing: ${currentStep?.current || 'Running...'}`
              : 'Multi-Channel Network claims processing'
            }
            {status.runId && (
              <span className="text-gray-400 ml-2">• Run ID: {status.runId}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status.status} running={status.running} />
          {onRefresh && (
            <RefreshButton
              onRefresh={onRefresh}
              disabled={status.running}
            />
          )}
        </div>
      </div>

      {/* Live Progress (only when running) */}
      {status.running && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-blue-900">
                {currentStep ? `Step ${currentStep.step} of ${currentStep.total}` : 'Processing'}
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                {currentStep?.current || 'Pipeline in progress...'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {Math.round(getProgress())}%
              </div>
              <div className="text-xs text-blue-600">
                {getProgress() === 100 ? 'Complete' : 'In Progress'}
              </div>
            </div>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>

          {status.startTime && (
            <div className="mt-3 text-xs text-blue-600">
              Started: {new Date(status.startTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {status.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Pipeline Failed</h3>
              <p className="text-red-700 mt-1">{status.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Idle State - Show Last Run Status */}
      {showIdleState && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          {status.lastRun ? (
            <div>
              {status.lastRun.status === 'completed' ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Last Run Completed</h3>
                    <p className="text-gray-600 mt-1">
                      Finished {new Date(status.lastRun.startTime).toLocaleString()} •
                      Duration: {formatDuration(status.lastRun.duration)}
                      {status.lastRun.id && (
                        <span className="text-gray-400 ml-2">• ID: {status.lastRun.id}</span>
                      )}
                    </p>

                    {status.lastRun.results && (
                      <div className="mt-3 text-sm text-gray-700">
                        {status.lastRun.results.claimsProcessed && (
                          <span>
                            {status.lastRun.results.claimsProcessed.new} new claims processed
                          </span>
                        )}
                        {status.lastRun.results.exports && status.lastRun.results.claimsProcessed && (
                          <span> • </span>
                        )}
                        {status.lastRun.results.exports && (
                          <span>
                            {Object.keys(status.lastRun.results.exports).length} files exported
                          </span>
                        )}
                        {status.lastRun.results.mcnVerdicts?.invalidMCIDs && status.lastRun.results.mcnVerdicts.invalidMCIDs > 0 && (
                          <span className="text-orange-600">
                            {status.lastRun.results.exports ? ' • ' : ''}
                            {status.lastRun.results.mcnVerdicts.invalidMCIDs} invalid MCIDs
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-green-700 text-sm mt-3 font-medium">
                      ✓ Ready to process next batch
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Last Run Failed</h3>
                    <p className="text-gray-600 mt-1">
                      Failed {new Date(status.lastRun.startTime).toLocaleString()}
                    </p>

                    {status.lastRun.error && (
                      <p className="text-red-700 text-sm mt-2">{status.lastRun.error}</p>
                    )}

                    <p className="text-red-700 text-sm mt-3 font-medium">
                      System ready but previous run had issues
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Ready</h3>
              <p className="text-gray-600">
                Pipeline is ready to process claims and verdicts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Steps - Only show when running or when showing idle state */}
      {(status.running || showIdleState) && (
        <PipelineSteps
          steps={status.steps}
          showDescriptions={status.running} // Hide descriptions during active run for cleaner view
        />
      )}
    </div>
  );
}