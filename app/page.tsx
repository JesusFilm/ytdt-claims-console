'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Activity, AlertTriangle } from 'lucide-react';
import UploadTab from '@/components/UploadTab';
import PipelineStatusTab from '@/components/PipelineStatusTab';
import PipelineHistoryTab from '@/components/PipelineHistoryTab';
import type { PipelineRun } from '@/types/PipelineRun';

const { format } = require('date-fns');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FileState {
  claims: File | null;
  mcnVerdicts: File | null;
  jfmVerdicts: File | null;
}

interface PipelineStatusState {
  running: boolean;
  status: string;
  error: string | null;
  result?: any;
  steps?: any[];
  progress?: number;
  lastRun?: {
    startTime: Date;
    duration: number;
    status: 'completed' | 'failed';
    error?: string;
    results?: any;
  };
}

interface SystemHealth {
  status: string;
  uptime: number;
  memory: { used: number; total: number; };
  enrich_ml_status?: 'healthy' | 'unhealthy';
}

export default function Home() {
  const [files, setFiles] = useState<FileState>({
    claims: null,
    mcnVerdicts: null,
    jfmVerdicts: null,
  });

  const [claimsSource, setClaimsSource] = useState('matter_entertainment');
  const [status, setStatus] = useState<PipelineStatusState>({
    running: false,
    status: 'idle',
    error: null,
    steps: []
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'status' | 'history'>('upload');
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [hasNewRun, setHasNewRun] = useState(false);

  // Fetch system health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        const health = await response.json();
        setSystemHealth(health);
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealth({
          status: 'error',
          uptime: 0,
          memory: { used: 0, total: 0 }
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch pipeline history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/runs/history`);
        const data = await response.json();
        setPipelineRuns(data.runs || []);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchHistory();
  }, [status.running]); // Refresh when pipeline completes

  // Poll for status when pipeline is running
  useEffect(() => {
    if (!status.running) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();

        // If pipeline just finished, fetch last run and stop polling
        if (data.running === false && status.running === true) {

          const historyResponse = await fetch(`${API_URL}/api/runs/history?limit=1`);
          const historyData = await historyResponse.json();
          const lastRun = historyData.runs?.[0];

          setStatus({
            ...data,
            lastRun: lastRun ? {
              startTime: new Date(lastRun.startTime),
              duration: lastRun.duration,
              status: lastRun.status,
              error: lastRun.error,
              results: lastRun.results
            } : undefined
          });

          // Mark new run available
          setHasNewRun(true);

          // Refresh full history
          setTimeout(() => {
            const fetchHistory = async () => {
              const fullHistoryResponse = await fetch(`${API_URL}/api/runs/history`);
              const fullHistoryData = await fullHistoryResponse.json();
              setPipelineRuns(fullHistoryData.runs || []);
            };
            fetchHistory();
          }, 1000);

        } else {
          // setStatus(data);
          setStatus(prevStatus => ({
            ...data,
            lastRun: prevStatus.lastRun
          }));
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status.running]);

  const handleFileDrop = useCallback((acceptedFiles: File[], fileType: keyof FileState) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [fileType]: acceptedFiles[0]
      }));
    }
  }, []);

  const handleFileRemove = useCallback((fileType: keyof FileState) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: null
    }));
  }, []);

  const handleRunPipeline = async () => {
    const hasFiles = files.claims || files.mcnVerdicts || files.jfmVerdicts;
    if (!hasFiles) {
      alert('Please upload at least one file');
      return;
    }

    setLoading(true);
    const formData = new FormData();

    if (files.claims) {
      formData.append('claims', files.claims);
      formData.append('claims_source', claimsSource);
    }
    if (files.mcnVerdicts) {
      formData.append('mcn_verdicts', files.mcnVerdicts);
    }
    if (files.jfmVerdicts) {
      formData.append('jfm_verdicts', files.jfmVerdicts);
    }

    try {
      const response = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Pipeline started:', result);

      // Switch to status view and start polling
      setActiveTab('status');
      setStatus({ running: true, status: 'starting', error: null });

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to start pipeline: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles({ claims: null, mcnVerdicts: null, jfmVerdicts: null });
    setStatus({ running: false, status: 'idle', error: null });
    setActiveTab('upload');
  };

  const handleRetry = async (runId: string) => {
    try {
      setLoading(true);

      // Start the retry
      const response = await fetch(`${API_URL}/api/runs/${runId}/retry`, {
        method: 'POST'  // Change to POST since we're starting a pipeline
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Pipeline retry started:', result);

      // Switch to status view and start polling
      setActiveTab('status');
      setStatus({ running: true, status: 'starting', error: null });

    } catch (error: any) {
      console.error('Retry error:', error);
      alert(`Failed to retry pipeline: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (runId: string) => {
    try {
      // Fetch exports list
      const response = await fetch(`${API_URL}/api/exports/run/${runId}`);
      const data = await response.json();

      // Download each file
      for (const file of data.files) {
        const link = document.createElement('a');
        link.href = `${API_URL}/api/exports/run/${runId}/${file.name}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed - unable to determine export folder');
    }
  };

  // Manual refresh function - clears lastRun and shows ready state
  const handleStatusRefresh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`);
      const data = await response.json();
      setStatus({ ...data, lastRun: undefined });
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
  };

  const isRunning = status.running || loading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YouTube MCN Pipeline</h1>
              <p className="text-gray-600">Multi-Channel Network claims processing dashboard</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {systemHealth?.status === 'ok' ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">System healthy</span>
                  </>
                ) : systemHealth?.status === 'degraded' ? (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-orange-600">System degraded</span>
                    {systemHealth.enrich_ml_status === 'unhealthy' && (
                      <span className="text-orange-600 ml-2">• ML service down</span>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">System offline</span>
                  </>
                )}
              </div>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Upload & Run
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Current Status
                  {status.running && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setHasNewRun(false);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  History ({pipelineRuns.length})
                  {hasNewRun && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <UploadTab
            files={files}
            claimsSource={claimsSource}
            isRunning={isRunning}
            loading={loading}
            handleFileDrop={handleFileDrop}
            handleFileRemove={handleFileRemove}
            setClaimsSource={setClaimsSource}
            handleRunPipeline={handleRunPipeline}
            handleReset={handleReset}
          />
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <PipelineStatusTab
            status={status}
            onRefresh={handleStatusRefresh}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <PipelineHistoryTab
            runs={pipelineRuns}
            onRetry={handleRetry}
            onDownload={handleDownload}
          />
        )}
      </main>
    </div>
  );
}