
import React, { useState, useCallback } from 'react';
import { runNewsPipeline } from './services/newsService';
import { Summary } from './types';
import Dashboard from './components/Dashboard';
import { PIPELINE_STEPS } from './constants';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const handleRunPipeline = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setSummary(null);
    setCurrentStep(0);

    try {
      await runNewsPipeline({
        onLog: addLog,
        onStepChange: setCurrentStep,
        onSummaryGenerated: setSummary,
      });
      addLog("✅ Pipeline completed successfully!");
      setCurrentStep(PIPELINE_STEPS.length); // Mark all steps as completed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addLog(`❌ Pipeline failed: ${errorMessage}`);
      setCurrentStep(-1); // Indicate failure
    } finally {
      setIsRunning(false);
    }
  }, [addLog]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Dashboard
        isRunning={isRunning}
        currentStep={currentStep}
        logs={logs}
        summary={summary}
        onRunPipeline={handleRunPipeline}
      />
    </div>
  );
};

export default App;
