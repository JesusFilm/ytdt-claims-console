// types/PipelineRun.ts
export interface PipelineRun {
  id: string;
  startTime: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
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
    driveFolderUrl?: string; 
  };
  error?: string;
  startedSteps: Array<{
    name: string;
    title: string;
    description: string;
    status: 'completed' | 'error' | 'skipped';
    timestamp: Date;
    duration?: number;
    error?: string;
  }>;
}