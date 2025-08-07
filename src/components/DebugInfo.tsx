import React from 'react';
import { Experiment } from '../types';

interface DebugInfoProps {
  currentExperiment: Experiment | null;
  workflowStep: string;
  selectedForkRunId: string | null;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ 
  currentExperiment, 
  workflowStep,
  selectedForkRunId 
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Debug Info</h4>
      <div className="space-y-1">
        <div>
          <strong>Workflow Step:</strong> {workflowStep}
        </div>
        <div>
          <strong>Experiment:</strong> {currentExperiment ? 'Exists' : 'None'}
        </div>
        <div>
          <strong>Runs Count:</strong> {currentExperiment?.runs?.length || 0}
        </div>
        <div>
          <strong>Fork Run ID:</strong> {selectedForkRunId || 'None'}
        </div>
        <div>
          <strong>Should Show DualPane:</strong> {
            currentExperiment && currentExperiment.runs.length > 1 ? 'Yes' : 'No'
          }
        </div>
        <div>
          <strong>Should Show Tree Button:</strong> {
            currentExperiment && currentExperiment.runs.length > 1 && workflowStep === 'evaluation' ? 'Yes' : 'No'
          }
        </div>
      </div>
    </div>
  );
};