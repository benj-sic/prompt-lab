import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { ExperimentRun } from '../types';

interface OutputComparisonProps {
  run1: ExperimentRun;
  run2: ExperimentRun;
  run1Index: number;
  run2Index: number;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const OutputComparison: React.FC<OutputComparisonProps> = ({
  run1,
  run2,
  run1Index,
  run2Index,
  showDetails = false,
  onToggleDetails,
}) => {
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

  const parameterChanges = getParameterChanges(run1, run2);
  const hasPromptChanges = run1.prompt !== run2.prompt;

  return (
    <div className="space-y-4">
      {/* Header with toggle for details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
          <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">
            Output Comparison
          </h4>
          <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
            Run {run1Index} vs Run {run2Index}
          </span>
        </div>
        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className="flex items-center space-x-1 text-xs text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3" />
                <span>Hide Details</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>Show Details</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Output Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* First Run Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-medium text-weave-light-primary dark:text-weave-dark-primary">
              Run {run1Index} Output
            </h5>
            <div className="flex items-center space-x-1 text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
              <Settings className="h-3 w-3" />
              <span>{run1.model} • {run1.temperature}</span>
            </div>
          </div>
          <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
              {run1.output || 'No output'}
            </div>
          </div>
        </div>

        {/* Second Run Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-medium text-weave-light-primary dark:text-weave-dark-primary">
              Run {run2Index} Output
            </h5>
            <div className="flex items-center space-x-1 text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
              <Settings className="h-3 w-3" />
              <span>{run2.model} • {run2.temperature}</span>
            </div>
          </div>
          <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
              {run2.output || 'No output'}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Parameter Changes */}
            {parameterChanges.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <h6 className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">Parameter Changes</h6>
                <div className="space-y-1">
                  {parameterChanges.map((change, index) => (
                    <div key={index} className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center space-x-2">
                      <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Changes */}
            {hasPromptChanges && (
              <div className="space-y-3">
                <h6 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Prompt Changes</h6>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Run {run1Index} Prompt</div>
                    <div className="text-sm leading-relaxed text-blue-700 dark:text-blue-300 whitespace-pre-wrap font-sans">
                      {run1.prompt}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Run {run2Index} Prompt</div>
                    <div className="text-sm leading-relaxed text-blue-700 dark:text-blue-300 whitespace-pre-wrap font-sans">
                      {run2.prompt}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 