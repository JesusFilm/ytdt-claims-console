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
  duration?: number;
  error?: string;
}

interface PipelineStepsProps {
  steps: PipelineStep[];
  showDescriptions?: boolean;
  compact?: boolean;
  className?: string;
}

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

const StepStatusIcon: React.FC<{ step: PipelineStep }> = ({ step }) => {
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

const formatStepName = (stepId: string) => {
  return stepId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

export default function PipelineSteps({
  steps,
  showDescriptions = false,
  compact = false,
  className = ''
}: PipelineStepsProps) {

  // Safety check for undefined steps
  if (!steps || steps.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Pipeline Steps</h3>
        </div>
        <div className="px-6 py-4 text-center text-gray-500">
          No steps available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Steps</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`px-6 hover:bg-gray-50 transition-colors ${compact ? 'py-3' : 'py-4'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                {getStepIcon(step.id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">
                    {step.name || formatStepName(step.id)}
                  </h4>
                </div>
                {showDescriptions && step.description && (
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                )}
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
                {step.duration && (
                  <p className="text-xs text-gray-400 mt-1">
                    Duration: {formatDuration(step.duration)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  Step {index + 1}
                </div>
                <StepStatusIcon step={step} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}