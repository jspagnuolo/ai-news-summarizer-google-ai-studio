
import React from 'react';
import Header from './Header';
import ControlPanel from './ControlPanel';
import StatusTracker from './StatusTracker';
import SummaryDisplay from './SummaryDisplay';
import LogViewer from './LogViewer';
import { Summary } from '../types';
import { PIPELINE_STEPS } from '../constants';

interface DashboardProps {
  isRunning: boolean;
  currentStep: number;
  logs: string[];
  summary: Summary | null;
  onRunPipeline: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isRunning, currentStep, logs, summary, onRunPipeline }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <ControlPanel isRunning={isRunning} onRunPipeline={onRunPipeline} />
            <StatusTracker steps={PIPELINE_STEPS} currentStep={currentStep} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <SummaryDisplay summary={summary} isRunning={isRunning} />
            <LogViewer logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
