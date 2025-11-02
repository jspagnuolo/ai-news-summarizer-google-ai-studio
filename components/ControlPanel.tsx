
import React from 'react';
import PlayIcon from './icons/PlayIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface ControlPanelProps {
  isRunning: boolean;
  onRunPipeline: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isRunning, onRunPipeline }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Controls</h2>
      <button
        onClick={onRunPipeline}
        disabled={isRunning}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors duration-200"
      >
        {isRunning ? (
          <>
            <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Processing...
          </>
        ) : (
          <>
            <PlayIcon className="-ml-1 mr-3 h-5 w-5 text-white" />
            Run Daily Pipeline Now
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Manually trigger the daily news aggregation and summarization process.
      </p>
    </div>
  );
};

export default ControlPanel;
