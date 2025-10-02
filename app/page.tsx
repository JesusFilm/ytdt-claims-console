'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { PlayCircle, Pause, Settings, Activity, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import PipelineStatus from '@/components/PipelineStatus';
import PipelineHistory from '@/components/PipelineHistory';

import { formatRunFiles } from '@/utils/formatFiles';
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
  memory: {
    used: number;
    total: number;
  };
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
          setStatus(data);
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
      // For now, just show message - full retry would need file recreation
      alert('Retry functionality requires re-uploading files. Please use the upload tab.');
    } catch (error) {
      console.error('Retry error:', error);
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
  const hasFiles = files.claims || files.mcnVerdicts || files.jfmVerdicts;

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
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                History ({pipelineRuns.length})
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Process YouTube MCN Claims
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your claims reports and verdict files to automatically process
                YouTube Multi-Channel Network data through our secure pipeline.
              </p>
            </div>

            {/* File Upload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <FileUpload
                file={files.claims}
                onDrop={(files) => handleFileDrop(files, 'claims')}
                onRemove={() => handleFileRemove('claims')}
                title="Claims Report"
                description="Latest MCN claims CSV from YouTube Studio"
                disabled={isRunning}
              />

              <FileUpload
                file={files.mcnVerdicts}
                onDrop={(files) => handleFileDrop(files, 'mcnVerdicts')}
                onRemove={() => handleFileRemove('mcnVerdicts')}
                title="MCN Verdicts"
                description="Verdict decisions for MCN claims"
                disabled={isRunning}
              />

              <FileUpload
                file={files.jfmVerdicts}
                onDrop={(files) => handleFileDrop(files, 'jfmVerdicts')}
                onRemove={() => handleFileRemove('jfmVerdicts')}
                title="JFM Verdicts"
                description="Verdict decisions for owned channel videos"
                disabled={isRunning}
              />
            </div>

            {/* Claims Source Selection */}
            {files.claims && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims Source</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="claimsSource"
                      value="matter_entertainment"
                      checked={claimsSource === 'matter_entertainment'}
                      onChange={(e) => setClaimsSource(e.target.value)}
                      disabled={isRunning}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Matter Entertainment</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="claimsSource"
                      value="matter_2"
                      checked={claimsSource === 'matter_2'}
                      onChange={(e) => setClaimsSource(e.target.value)}
                      disabled={isRunning}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Matter 2</span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleReset}
                disabled={isRunning}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset Files
              </button>

              <button
                onClick={handleRunPipeline}
                disabled={isRunning || !hasFiles}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting Pipeline...
                  </>
                ) : isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pipeline Running
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Run Pipeline
                  </>
                )}
              </button>
            </div>

            {/* File Summary */}
            {hasFiles && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Ready to Process</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  {formatRunFiles(files, true).map(file => <p key={file}>• {file}</p>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <PipelineStatus
            status={status}
            onRefresh={handleStatusRefresh}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <PipelineHistory
            runs={pipelineRuns}
            onRetry={handleRetry}
            onDownload={handleDownload}
          />
        )}
      </main>
    </div>
  );
}