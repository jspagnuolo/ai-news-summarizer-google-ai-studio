
import React from 'react';
import { Summary } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface SummaryDisplayProps {
  summary: Summary | null;
  isRunning: boolean;
}

const SummarySection: React.FC<{ title: string; points: string[] }> = ({ title, points }) => (
  <div>
    <h3 className="text-lg font-semibold text-sky-400 mb-2">{title}</h3>
    <ul className="list-disc list-inside space-y-2 text-gray-300">
      {points.map((point, index) => (
        <li key={index}>{point}</li>
      ))}
    </ul>
  </div>
);

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, isRunning }) => {
  const renderContent = () => {
    if (isRunning && !summary) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <SpinnerIcon className="w-12 h-12 animate-spin text-sky-500" />
          <p className="mt-4 text-lg">Generating Summary...</p>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <p className="text-lg">No summary generated yet.</p>
          <p className="text-sm">Click "Run Daily Pipeline Now" to start.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">{summary.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-700 p-3 rounded-lg"><p className="text-xs text-gray-400">Topic</p><p className="font-semibold">{summary.topicName}</p></div>
          <div className="bg-gray-700 p-3 rounded-lg"><p className="text-xs text-gray-400">Articles Analyzed</p><p className="font-semibold">{summary.articleCount}</p></div>
          <div className="bg-gray-700 p-3 rounded-lg"><p className="text-xs text-gray-400">US Sources</p><p className="font-semibold">{summary.usSources}</p></div>
          <div className="bg-gray-700 p-3 rounded-lg"><p className="text-xs text-gray-400">Venezuelan Sources</p><p className="font-semibold">{summary.venezuelanSources}</p></div>
        </div>
        
        <div className="space-y-6 bg-gray-900/50 p-6 rounded-lg">
            <SummarySection title="Overall Highlights" points={summary.overallHighlights} />
            <SummarySection title="US Perspective" points={summary.usPerspective} />
            <SummarySection title="Inside Venezuela" points={summary.venezuelanPerspective} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-sky-400 mb-2">Sources ({summary.sources.length})</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm max-h-60 overflow-y-auto pr-2">
            {summary.sources.map((source, index) => (
              <li key={index}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                  {source.title}
                </a> - <span className="text-gray-500">{source.source}, {source.publishedDate}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg min-h-[400px] flex flex-col">
      {renderContent()}
    </div>
  );
};

export default SummaryDisplay;
