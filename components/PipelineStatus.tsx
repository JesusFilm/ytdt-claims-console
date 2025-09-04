import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  Database,
  Upload as UploadIcon,
  Cpu,
  Cloud
} from 'lucide-react';

export interface PipelineStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface PipelineStatusProps {
  status: {
    running: boolean;
    status: string;
    error: string | null;
    result?: {
      success: boolean;
      duration: number;
      outputs?: {
        claimsProcessed?: { total: number; new: number };
        mcnVerdicts?: { processed: number; invalidMCIDs: number };
        jfmVerdicts?: { processed: number; invalidMCIDs: number };
        exports?: Record<string, { rows: number; path: string }>;
        driveUploads?: Array<{ name: string; size: number; rows: number }>;
      };
    };
  };
}

const PipelineStepIcon: React.FC<{ step: PipelineStep }> = ({ step }) => {
  const iconProps = { className: "w-5 h-5" };
  
  switch (step.status) {
    case 'completed':
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
    case 'running':
      return <Loader2 {...iconProps} className="w-5 h-5 text-blue-600 animate-spin" />;
    case 'error':
      return <AlertCircle {...iconProps} className="w-5 h-5 text-red-600" />;
    case 'skipped':
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  }
};

const getStepIcon = (stepId: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'connect_vpn': Cloud,
    'backup_tables': Database,
    'process_claims': UploadIcon,
    'process_mcn_verdicts': CheckCircle,
    'process_jfm_verdicts': CheckCircle,
    'export_views': Database,
    'enrich_ml': Cpu,
    'upload_drive': Cloud
  };
  
  const Icon = iconMap[stepId] || Clock;
  return <Icon className="w-4 h-4" />;
};

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

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
      <Clock className="w-4 h-4" />
      Idle
    </div>
  );
};

export default function PipelineStatus({ status }: PipelineStatusProps) {
  // Mock pipeline steps based on your backend structure
  const steps: PipelineStep[] = [
    { id: 'connect_vpn', name: 'VPN Connection', description: 'Establishing secure connection', status: status.running ? 'completed' : 'pending' },
    { id: 'backup_tables', name: 'Database Backup', description: 'Creating backup tables', status: status.running ? 'completed' : 'pending' },
    { id: 'process_claims', name: 'Process Claims', description: 'Importing new claims data', status: status.running ? 'completed' : 'pending' },
    { id: 'process_mcn_verdicts', name: 'MCN Verdicts', description: 'Applying verdict updates', status: status.running ? 'completed' : 'pending' },
    { id: 'process_jfm_verdicts', name: 'JFM Verdicts', description: 'Processing channel verdicts', status: status.running ? 'running' : 'pending' },
    { id: 'export_views', name: 'Export Views', description: 'Generating export files', status: 'pending' },
    { id: 'enrich_ml', name: 'ML Enrichment', description: 'Adding predictions', status: 'pending' },
    { id: 'upload_drive', name: 'Upload to Drive', description: 'Syncing to Google Drive', status: 'pending' }
  ];

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const getProgress = () => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return (completed / steps.length) * 100;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline Status</h2>
          <p className="text-gray-600 mt-1">Multi-Channel Network claims processing</p>
        </div>
        <StatusBadge status={status.status} running={status.running} />
      </div>

      {/* Progress Bar */}
      {status.running && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(getProgress())}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
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

      {/* Pipeline Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Pipeline Steps</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {steps.map((step, index) => (
            <div key={step.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  {getStepIcon(step.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                    <PipelineStepIcon step={step} />
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  )}
                  {step.error && (
                    <p className="text-sm text-red-600 mt-1">{step.error}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Step {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {status.result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Pipeline Completed Successfully</h3>
              <p className="text-green-700 mt-1">
                Duration: {formatDuration(status.result.duration)}
              </p>
              
              {status.result.outputs && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {status.result.outputs.claimsProcessed && (
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-gray-900">Claims Processed</p>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        {status.result.outputs.claimsProcessed.new.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {status.result.outputs.claimsProcessed.total.toLocaleString()} total
                      </p>
                    </div>
                  )}
                  
                  {status.result.outputs.exports && (
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-gray-900">Files Exported</p>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        {Object.keys(status.result.outputs.exports).length}
                      </p>
                      <p className="text-xs text-gray-500">CSV files</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}