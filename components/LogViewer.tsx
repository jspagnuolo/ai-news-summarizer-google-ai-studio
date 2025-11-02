
import React, { useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-inner">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">Process Logs</h2>
      <div
        ref={logContainerRef}
        className="h-64 bg-black/50 rounded p-3 text-xs font-mono text-gray-300 overflow-y-auto whitespace-pre-wrap"
      >
        {logs.length > 0 ? logs.join('\n') : <span className="text-gray-500">Logs will appear here...</span>}
      </div>
    </div>
  );
};

export default LogViewer;
