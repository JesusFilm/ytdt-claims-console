import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  RotateCcw,
  Calendar,
  FileText,
  TrendingUp,
  Database
} from 'lucide-react';

export interface PipelineRun {
  id: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  files: {
    claims?: string;
    claimsSource?: string;
    mcnVerdicts?: string;
    jfmVerdicts?: string;
  };
  results?: {
    claimsProcessed?: { total: number; new: number };
    verdictsProcessed?: number;
    exportsGenerated?: number;
    invalidMCIDs?: number;
  };
  error?: string;
}

interface PipelineHistoryProps {
  runs: PipelineRun[];
  onRetry?: (runId: string) => void;
  onDownload?: (runId: string) => void;
  className?: string;
}

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
    default:
      return <Clock {...iconProps} className="w-5 h-5 text-gray-400" />;
  }
};

const StatusBadge: React.FC<{ status: PipelineRun['status'] }> = ({ status }) => {
  const styles = {
    running: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const RunCard: React.FC<{ 
  run: PipelineRun; 
  onRetry?: (runId: string) => void;
  onDownload?: (runId: string) => void;
}> = ({ run, onRetry, onDownload }) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getRunFiles = () => {
    const files = [];
    if (run.files.claims) {
      files.push(`Claims: ${run.files.claims}${run.files.claimsSource ? ` (${run.files.claimsSource})` : ''}`);
    }
    if (run.files.mcnVerdicts) {
      files.push(`MCN: ${run.files.mcnVerdicts}`);
    }
    if (run.files.jfmVerdicts) {
      files.push(`JFM: ${run.files.jfmVerdicts}`);
    }
    return files.join(' • ');
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
              <h3 className="font-semibold text-gray-900">{formatTimestamp(run.timestamp)}</h3>
              <StatusBadge status={run.status} />
            </div>
            
            {getRunFiles() && (
              <p className="text-sm text-gray-600 mb-2">{getRunFiles()}</p>
            )}
            
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
          {run.status === 'completed' && onDownload && (
            <button
              onClick={() => onDownload(run.id)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download exports"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {run.status === 'failed' && onRetry && (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {run.results.claimsProcessed && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Claims</span>
              </div>
              <p className="font-semibold text-gray-900">
                +{run.results.claimsProcessed.new.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                of {run.results.claimsProcessed.total.toLocaleString()}
              </p>
            </div>
          )}
          
          {run.results.verdictsProcessed && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Verdicts</span>
              </div>
              <p className="font-semibold text-gray-900">
                {run.results.verdictsProcessed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">processed</p>
            </div>
          )}
          
          {run.results.exportsGenerated && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Exports</span>
              </div>
              <p className="font-semibold text-gray-900">{run.results.exportsGenerated}</p>
              <p className="text-xs text-gray-500">files generated</p>
            </div>
          )}
          
          {run.results.invalidMCIDs && run.results.invalidMCIDs > 0 && (
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-600">Issues</span>
              </div>
              <p className="font-semibold text-orange-600">{run.results.invalidMCIDs}</p>
              <p className="text-xs text-orange-500">invalid MCIDs</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function PipelineHistory({ 
  runs, 
  onRetry, 
  onDownload, 
  className = '' 
}: PipelineHistoryProps) {
  const getStats = () => {
    const total = runs.length;
    const successful = runs.filter(r => r.status === 'completed').length;
    const failed = runs.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    return { total, successful, failed, successRate };
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
            />
          ))
        )}
      </div>
    </div>
  );
}