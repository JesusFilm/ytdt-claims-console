// types/PipelineRun.ts
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
    mcnVerdicts?: { processed: number; invalidMCIDs: string[] };
    jfmVerdicts?: { processed: number; invalidMCIDs: string[] };
    exports?: Record<string, { rows: number; path: string }>;
    driveUploads?: Array<{ name: string; size: number; rows: number }>;
  };
  error?: string;
  completedSteps: Array<{
    name: string;
    status: 'completed' | 'error' | 'skipped';
    timestamp: Date;
    duration?: number;
    error?: string;
  }>;
}