import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare } from 'lucide-react';
import { ExperimentRun, Experiment } from '../types';
import { PromptDiff } from './PromptDiff';

interface DualPaneRunComparisonProps {
  experiment: Experiment;
  onSaveComparison: (run1Id: string, run2Id: string, notes: string) => void;
  onSelectRunToFork: (runId: string) => void;
  onFinishExperiment?: () => void;
  canProceedToNextRun?: boolean;
  nextRunDisabledReason?: string;
  // New props for external button control
  onComparisonNotesChange?: (notes: string) => void;
  onForkRunChange?: (runId: string) => void;
  comparisonNotes?: string;
  selectedForkRunId?: string;
}

export const DualPaneRunComparison: React.FC<DualPaneRunComparisonProps> = ({
  experiment,
  onSaveComparison,
  onSelectRunToFork,
  onFinishExperiment,
  canProceedToNextRun = true,
  nextRunDisabledReason = '',
  // New props for external button control
  onComparisonNotesChange,
  onForkRunChange,
  comparisonNotes: externalComparisonNotes,
  selectedForkRunId: externalSelectedForkRunId,
}) => {
  const [leftRunId, setLeftRunId] = useState<string>('');
  const [rightRunId, setRightRunId] = useState<string>('');
  const [comparisonNotes, setComparisonNotes] = useState('');


  const [showPromptDiff, setShowPromptDiff] = useState(false);
  const [selectedForkRunId, setSelectedForkRunId] = useState<string>('');

  // Use external props if provided, otherwise use internal state
  const finalComparisonNotes = externalComparisonNotes !== undefined ? externalComparisonNotes : comparisonNotes;
  const finalSelectedForkRunId = externalSelectedForkRunId !== undefined ? externalSelectedForkRunId : selectedForkRunId;

  // Update internal state when external props change
  useEffect(() => {
    if (externalComparisonNotes !== undefined) {
      setComparisonNotes(externalComparisonNotes);
    }
  }, [externalComparisonNotes]);

  // Handle fork run selection logic (consolidated to avoid race conditions)
  useEffect(() => {
    if (experiment.runs.length >= 2) {
      const currentRun = experiment.runs[experiment.runs.length - 1];
      const previousRun = experiment.runs[experiment.runs.length - 2];
      setLeftRunId(previousRun.id);
      setRightRunId(currentRun.id);
      
      // Handle fork run selection
      if (externalSelectedForkRunId !== undefined) {
        if (externalSelectedForkRunId === '') {
          // Clear the selection when explicitly set to empty string
          setSelectedForkRunId('');
          onForkRunChange?.('');
        } else if (externalSelectedForkRunId !== '') {
          // Set to the provided value
          setSelectedForkRunId(externalSelectedForkRunId);
        }
      } else if (!selectedForkRunId) {
        // Auto-select the newer (right pane) run as default fork if no fork is explicitly selected
        setSelectedForkRunId('');
        onForkRunChange?.('');
      }
    } else if (experiment.runs.length === 1) {
      setLeftRunId(experiment.runs[0].id);
      setRightRunId('');
      
      // Handle fork run selection
      if (externalSelectedForkRunId !== undefined) {
        if (externalSelectedForkRunId === '') {
          // Clear the selection when explicitly set to empty string
          setSelectedForkRunId('');
          onForkRunChange?.('');
        } else if (externalSelectedForkRunId !== '') {
          // Set to the provided value
          setSelectedForkRunId(externalSelectedForkRunId);
        }
      } else if (!selectedForkRunId) {
        // Auto-select the single run as default fork if no fork is explicitly selected
        setSelectedForkRunId(experiment.runs[0].id);
        onForkRunChange?.(experiment.runs[0].id);
      }
    }
  }, [experiment.runs, externalSelectedForkRunId, selectedForkRunId, onForkRunChange]);

  // Load existing comparison notes when runs are selected
  useEffect(() => {
    if (leftRunId && rightRunId) {
      const existingComparison = experiment.analysis?.runComparisons?.find(
        comp => (comp.run1Id === leftRunId && comp.run2Id === rightRunId) ||
                (comp.run1Id === rightRunId && comp.run2Id === leftRunId)
      );
      const notes = existingComparison?.notes || '';
      setComparisonNotes(notes);
      // Also update external state if the callback is provided
      onComparisonNotesChange?.(notes);
    } else {
      setComparisonNotes('');
      onComparisonNotesChange?.('');
    }
  }, [leftRunId, rightRunId, experiment.analysis, onComparisonNotesChange]);

  // Auto-save comparison notes when they change (with debounce)
  useEffect(() => {
    if (leftRunId && rightRunId && finalComparisonNotes.trim()) {
      const timeoutId = setTimeout(() => {
        onSaveComparison(leftRunId, rightRunId, finalComparisonNotes);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [leftRunId, rightRunId, finalComparisonNotes, onSaveComparison]);

  const leftRun = experiment.runs.find(r => r.id === leftRunId);
  const rightRun = experiment.runs.find(r => r.id === rightRunId);

  const getRunDisplayName = (run: ExperimentRun) => {
    const index = experiment.runs.findIndex(r => r.id === run.id) + 1;
    return `Run ${index}`;
  };

  const getRunWithParameters = (run: ExperimentRun) => {
    const index = experiment.runs.findIndex(r => r.id === run.id) + 1;
    
    return `Run ${index}`;
  };

  const getParameterChanges = (run1: ExperimentRun, run2: ExperimentRun) => {
    const changes = [];
    if (run1.temperature !== run2.temperature) {
      changes.push(`Temperature: ${run1.temperature} → ${run2.temperature}`);
    }
    if (run1.maxTokens !== run2.maxTokens) {
      changes.push(`Max Tokens: ${run1.maxTokens} → ${run2.maxTokens}`);
    }
    if (run1.model !== run2.model) {
      changes.push(`Model: ${run1.model} → ${run2.model}`);
    }
    return changes;
  };

  const parameterChanges = leftRun && rightRun ? getParameterChanges(leftRun, rightRun) : [];

  // Helper function to determine if a run option should be disabled
  const isRunOptionDisabled = (runId: string, isLeftPane: boolean) => {
    if (isLeftPane) {
      // In left pane, disable if it's the same as right pane selection (and right pane has a selection)
      return runId === rightRunId && rightRunId !== '';
    } else {
      // In right pane, disable if it's the same as left pane selection (and left pane has a selection)
      return runId === leftRunId && leftRunId !== '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-5 w-5 text-weave-light-accent dark:text-weave-dark-accent" />
          <div>
            <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
              Compare Run Outputs
            </h3>
            
          </div>
        </div>
        <div className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
          {experiment.runs.length} run{experiment.runs.length !== 1 ? 's' : ''} completed
        </div>
      </div>

      {/* Dual Output Panes */}
      {experiment.runs.length === 0 ? (
        <div className="text-center py-8 text-weave-light-secondary dark:text-weave-dark-secondary">
          <p>No runs available to compare yet.</p>
          <p className="text-sm mt-2">Run your first experiment to start comparing outputs.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
              Left Pane
            </label>
            <select
              value={leftRunId}
              onChange={(e) => setLeftRunId(e.target.value)}
              className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText"
            >
              <option value="">Select a run...</option>
              {experiment.runs.map((run) => (
                <option 
                  key={run.id} 
                  value={run.id}
                  disabled={isRunOptionDisabled(run.id, true)}
                >
                  {getRunWithParameters(run)}
                </option>
              ))}
            </select>
          </div>

          {/* Left Output Display */}
          {leftRun && (
            <div className="space-y-3">
              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-6">
                
                <div className="h-96 overflow-y-auto">
                  <div className="text-base leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                    {leftRun.output || 'No output'}
                  </div>
                </div>
              </div>

              {/* Left Fork Selection */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const newForkRunId = leftRun.id;
                    setSelectedForkRunId(newForkRunId);
                    onForkRunChange?.(newForkRunId);
                  }}
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                    finalSelectedForkRunId === leftRun.id
                      ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white border border-weave-light-accent dark:border-weave-dark-accent'
                      : 'bg-transparent border border-weave-light-border dark:border-weave-dark-border text-weave-light-secondary dark:text-weave-dark-secondary hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted hover:text-weave-light-accent dark:hover:text-weave-dark-accent'
                  }`}
                >
                  <span className="text-sm font-medium">
                    Fork from {getRunDisplayName(leftRun)}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Pane */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div>
            <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
              Right Pane
            </label>
            <select
              value={rightRunId}
              onChange={(e) => setRightRunId(e.target.value)}
              className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText"
            >
              <option value="">Select a run...</option>
              {experiment.runs.map((run) => (
                <option 
                  key={run.id} 
                  value={run.id}
                  disabled={isRunOptionDisabled(run.id, false)}
                >
                  {getRunWithParameters(run)}
                </option>
              ))}
            </select>
          </div>

          {/* Right Output Display */}
          {rightRun && (
            <div className="space-y-3">
              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-6">
                
                <div className="h-96 overflow-y-auto">
                  <div className="text-base leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                    {rightRun.output || 'No output'}
                  </div>
                </div>
              </div>

              {/* Right Fork Selection */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const newForkRunId = rightRun.id;
                    setSelectedForkRunId(newForkRunId);
                    onForkRunChange?.(newForkRunId);
                  }}
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                    finalSelectedForkRunId === rightRun.id
                      ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white border border-weave-light-accent dark:border-weave-dark-accent'
                      : 'bg-transparent border border-weave-light-border dark:border-weave-dark-border text-weave-light-secondary dark:text-weave-dark-secondary hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted hover:text-weave-light-accent dark:hover:text-weave-dark-accent'
                  }`}
                >
                  <span className="text-sm font-medium">
                    Fork from {getRunDisplayName(rightRun)}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      )}

      {/* Prompt Differences Section */}
      {leftRun && rightRun && leftRun.prompt !== rightRun.prompt && (
        <div className="mt-6">
          <PromptDiff
            originalPrompt={leftRun.prompt}
            currentPrompt={rightRun.prompt}
            showDiff={showPromptDiff}
            onToggleDiff={() => setShowPromptDiff(!showPromptDiff)}
            originalLabel={`${getRunDisplayName(leftRun)} Prompt`}
            currentLabel={`${getRunDisplayName(rightRun)} Prompt`}
          />
        </div>
      )}

      {/* Parameter Changes */}
      {parameterChanges.length > 0 && (
        <div className="p-4 bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted rounded-lg border border-weave-light-accent dark:border-weave-dark-accent">
          <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary mb-3">
            Parameter Changes
          </h4>
          <div className="space-y-2">
            {parameterChanges.map((change, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-weave-light-secondary dark:text-weave-dark-secondary">{change}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Notes */}
      <div>
        <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
          {leftRun && rightRun ? `Comparison Notes (${getRunDisplayName(leftRun)} vs ${getRunDisplayName(rightRun)})` : 'Comparison Notes'}
        </label>
        <textarea
          value={finalComparisonNotes}
          onChange={(e) => {
            const newNotes = e.target.value;
            setComparisonNotes(newNotes);
            onComparisonNotesChange?.(newNotes);
          }}
          placeholder="What differences do you observe? Which run performed better and why? What would you change next? e.g., Left run shows more creativity but right run follows instructions better. Need to balance temperature..."
          className="w-full h-32 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
        />
      </div>

    </div>
  );
};