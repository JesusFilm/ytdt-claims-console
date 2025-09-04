interface StatusDisplayProps {

  status: {
    running: boolean;
    status: string;
    error: string | null;
    result?: {
      success: boolean;
      duration: number;
      outputs?: {
        claimsProcessed?: {
          total: number;
          new: number;
        };
        mcnVerdicts?: {
          processed: number;
          invalidMCIDs: number;
        };
        jfmVerdicts?: {
          processed: number;
          invalidMCIDs: number;
        };
        exports?: Record<string, { rows: number; path: string }>;
        driveUploads?: Array<{ name: string; size: number; rows: number }>;
      };
    };
  };
}


export default function StatusDisplay({ status }: StatusDisplayProps) {

  const getStatusColor = () => {
    if (status.error) return 'red';
    if (status.running) return 'blue';
    if (status.status === 'completed') return 'green';
    return 'gray';
  };

  const color = getStatusColor();

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Status</h2>
        <div className="flex items-center gap-2">
          {status.running && (
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800`}>
            {status.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {status.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error: {status.error}</p>
        </div>
      )}

      {status.result && (
        <div className="space-y-4">
          {status.result.duration && (
            <p className="text-sm text-gray-600">
              Duration: {Math.round(status.result.duration / 1000)}s
            </p>
          )}

          {status.result.outputs?.claimsProcessed && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-1">Claims Processed</h3>
              <p className="text-sm text-gray-600">
                Total: {status.result.outputs.claimsProcessed.total.toLocaleString()} | 
                New: {status.result.outputs.claimsProcessed.new.toLocaleString()}
              </p>
            </div>
          )}

          {status.result.outputs?.mcnVerdicts && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-1">MCN Verdicts</h3>
              <p className="text-sm text-gray-600">
                Processed: {status.result.outputs.mcnVerdicts.processed.toLocaleString()}
                {status.result.outputs.mcnVerdicts.invalidMCIDs > 0 && (
                  <span className="text-yellow-600 ml-2">
                    ({status.result.outputs.mcnVerdicts.invalidMCIDs} invalid MCIDs)
                  </span>
                )}
              </p>
            </div>
          )}

          {status.result.outputs?.jfmVerdicts && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-1">JFM Verdicts</h3>
              <p className="text-sm text-gray-600">
                Processed: {status.result.outputs.jfmVerdicts.processed.toLocaleString()}
                {status.result.outputs.jfmVerdicts.invalidMCIDs > 0 && (
                  <span className="text-yellow-600 ml-2">
                    ({status.result.outputs.jfmVerdicts.invalidMCIDs} invalid MCIDs)
                  </span>
                )}
              </p>
            </div>
          )}

          {status.result.outputs?.exports && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Exported Views</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(status.result.outputs.exports).map(([name, info]) => (
                  <li key={name}>
                    {name}: {info.rows.toLocaleString()} rows
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.result.outputs?.driveUploads && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Google Drive Uploads</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {status.result.outputs.driveUploads.map((file, i) => (
                  <li key={i}>
                    {file.name} ({file.rows.toLocaleString()} rows)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}