'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import FileUpload from '@/components/FileUpload';
import StatusDisplay from '@/components/StatusDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FileState {
  claims: File | null;
  mcnVerdicts: File | null;
  jfmVerdicts: File | null;
}

interface PipelineStatus {
  running: boolean;
  status: string;
  error: string | null;
  result?: any;
}

export default function Home() {
  
  const [files, setFiles] = useState<FileState>({
    claims: null,
    mcnVerdicts: null,
    jfmVerdicts: null,
  });
  const [claimsSource, setClaimsSource] = useState('matter_entertainment');
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll for status
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/status`);
        setStatus(response.data);
        
        if (!response.data.running) {
          setPolling(false);
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling]);

  const handleFileDrop = useCallback((acceptedFiles: File[], fileType: keyof FileState) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [fileType]: acceptedFiles[0]
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files.claims && !files.mcnVerdicts && !files.jfmVerdicts) {
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
      const response = await axios.post(`${API_URL}/api/run`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Pipeline started:', response.data);
      setPolling(true);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to start pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles({
      claims: null,
      mcnVerdicts: null,
      jfmVerdicts: null,
    });
    setStatus(null);
    setPolling(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          YouTube MCN Pipeline
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
          {/* Claims File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claims Report (Optional)
            </label>
            <FileUpload
              file={files.claims}
              onDrop={(files) => handleFileDrop(files, 'claims')}
              accept=".csv"
              label="Drop claims CSV here or click to browse"
            />
            {files.claims && (
              <select
                value={claimsSource}
                onChange={(e) => setClaimsSource(e.target.value)}
                className="mt-2 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="matter_entertainment">Matter Entertainment</option>
                <option value="matter_2">Matter 2</option>
              </select>
            )}
          </div>

          {/* MCN Verdicts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MCN Verdicts (Optional)
            </label>
            <FileUpload
              file={files.mcnVerdicts}
              onDrop={(files) => handleFileDrop(files, 'mcnVerdicts')}
              accept=".csv"
              label="Drop MCN verdicts CSV here or click to browse"
            />
          </div>

          {/* JFM Verdicts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JFM Verdicts (Optional)
            </label>
            <FileUpload
              file={files.jfmVerdicts}
              onDrop={(files) => handleFileDrop(files, 'jfmVerdicts')}
              accept=".csv"
              label="Drop JFM verdicts CSV here or click to browse"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || (status?.running ?? false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : status?.running ? 'Pipeline Running' : 'Run Pipeline'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Status Display */}
        {status && (
          <div className="mt-8">
            <StatusDisplay status={status} />
          </div>
        )}
      </div>
    </main>
  );
}