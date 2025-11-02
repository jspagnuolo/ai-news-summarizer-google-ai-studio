
import React from 'react';
import CheckIcon from './icons/CheckIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import DotIcon from './icons/DotIcon';

interface Step {
  name: string;
  description: string;
}

interface StatusTrackerProps {
  steps: Step[];
  currentStep: number;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ steps, currentStep }) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'in_progress';
    return 'pending';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="h-5 w-5 text-green-400" />;
      case 'in_progress':
        return <SpinnerIcon className="h-5 w-5 text-sky-400 animate-spin" />;
      default:
        return <DotIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Pipeline Status</h2>
      <nav aria-label="Progress">
        <ol role="list" className="overflow-hidden">
          {steps.map((step, stepIdx) => {
            const status = getStepStatus(stepIdx);
            return (
              <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pb-10' : ''}`}>
                {stepIdx !== steps.length - 1 ? (
                  <div className={`absolute left-2.5 top-4 -ml-px mt-0.5 h-full w-0.5 ${status === 'completed' ? 'bg-green-400' : 'bg-gray-600'}`} />
                ) : null}
                <div className="relative flex items-start group">
                  <span className="h-9 flex items-center">
                    <span className={`relative z-10 w-6 h-6 flex items-center justify-center rounded-full ${status === 'completed' ? 'bg-green-800' : 'bg-gray-700'}`}>
                      <StatusIcon status={status} />
                    </span>
                  </span>
                  <span className="ml-4 min-w-0 flex flex-col">
                    <span className={`text-sm font-medium ${status === 'in_progress' ? 'text-sky-400' : status === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>{step.name}</span>
                    <span className="text-xs text-gray-500">{step.description}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default StatusTracker;
