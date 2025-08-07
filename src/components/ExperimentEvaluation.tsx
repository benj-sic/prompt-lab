import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, GitCompare, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { ExperimentRun, ExperimentEvaluation as EvaluationType, Experiment } from '../types';
import { PromptDiff } from './PromptDiff';
import { OutputComparison } from './OutputComparison';

interface ExperimentEvaluationProps {
  run: ExperimentRun;
  experiment: Experiment;
  onSaveEvaluation: (evaluation: EvaluationType) => void;
  onNextRun: () => void;
  onResetToOriginal?: () => void;
  originalPrompt?: string;
  onFeedbackChange?: (feedback: string) => void;
  initialFeedback?: string;
}

export const ExperimentEvaluation: React.FC<ExperimentEvaluationProps> = ({
  run,
  experiment,
  onSaveEvaluation,
  onNextRun,
  onResetToOriginal,
  originalPrompt,
  onFeedbackChange,
  initialFeedback = '',
}) => {
  const [feedback, setFeedback] = useState(initialFeedback);

  const [highlightedChanges, setHighlightedChanges] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    comparison: true,
    prompts: false,
    observations: true,
  });
  const [showPromptDiff, setShowPromptDiff] = useState(false);

  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect changes and highlight them
  useEffect(() => {
    if (experiment.runs.length > 1) {
      const previousRun = experiment.runs[experiment.runs.length - 2];
      const changes = [];
      
      if (run.temperature !== previousRun.temperature) {
        changes.push(`Temperature changed from ${previousRun.temperature} to ${run.temperature}`);
      }
      if (run.maxTokens !== previousRun.maxTokens) {
        changes.push(`Max tokens changed from ${previousRun.maxTokens} to ${run.maxTokens}`);
      }
      if (run.model !== previousRun.model) {
        changes.push(`Model changed from ${previousRun.model} to ${run.model}`);
      }
      if (run.prompt !== previousRun.prompt) {
        changes.push('Prompt content was modified');
      }
      
      setHighlightedChanges(changes);
    }
  }, [run, experiment]);



  // Notify parent component of feedback changes
  useEffect(() => {
    onFeedbackChange?.(feedback);
  }, [feedback, onFeedbackChange]);

  const hasMultipleRuns = experiment.runs.length > 1;
  const previousRun = experiment.runs.length > 1 ? experiment.runs[experiment.runs.length - 2] : null;
  
  // Determine current run number
  const currentRunIndex = experiment.runs.findIndex(r => r.id === run.id);
  const currentRunNumber = currentRunIndex + 1;





  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  return (
    <div className="space-y-4">
      {/* Changes Highlight Banner */}
      {highlightedChanges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Changes Detected</h4>
            </div>
            {onResetToOriginal && (
              <button
                onClick={onResetToOriginal}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {highlightedChanges.map((change, index) => (
              <div key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>{change}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Side-by-Side Comparison */}
      {hasMultipleRuns && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleSection('comparison')}
            className="w-full flex items-center justify-between p-4 hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
          >
            <div className="flex items-center space-x-2">
              <GitCompare className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
              <span className="font-medium text-weave-light-primary dark:text-weave-dark-primary">
                Output Comparison
              </span>
            </div>
            {expandedSections.comparison ? (
              <ChevronUp className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.comparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-weave-light-border dark:border-weave-dark-border"
              >
                <div className="p-4">
                  <OutputComparison
                    run1={previousRun!}
                    run2={run}
                    run1Index={experiment.runs.length - 1}
                    run2Index={experiment.runs.length}
                    showDetails={true}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Prompt Diff Section */}
      {originalPrompt && originalPrompt !== run.prompt && (
        <PromptDiff
          originalPrompt={originalPrompt}
          currentPrompt={run.prompt}
          showDiff={showPromptDiff}
          onToggleDiff={() => setShowPromptDiff(!showPromptDiff)}
          originalLabel={`Run 1 Prompt`}
          currentLabel={`Run ${currentRunNumber} Prompt`}
        />
      )}

      {/* Prompts Section */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleSection('prompts')}
          className="w-full flex items-center justify-between p-4 hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
        >
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
            <span className="font-medium text-weave-light-primary dark:text-weave-dark-primary">
              Prompts & Outputs
            </span>
          </div>
          {expandedSections.prompts ? (
            <ChevronUp className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.prompts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-weave-light-border dark:border-weave-dark-border"
            >
              <div className="p-4 space-y-4">
                {/* Current Prompt */}
                <div>
                  <h5 className="text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                    Run {currentRunNumber} Prompt
                  </h5>
                  <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap">
                      {run.prompt}
                    </div>
                  </div>
                </div>

                {/* Original Prompt (if different) */}
                {originalPrompt && originalPrompt !== run.prompt && (
                  <div>
                    <h5 className="text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                      Run 1 Prompt
                    </h5>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 max-h-32 overflow-y-auto">
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {originalPrompt}
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Prompt (if available) */}
                {previousRun && previousRun.prompt !== run.prompt && (
                  <div>
                    <h5 className="text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                      Previous Prompt
                    </h5>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 max-h-32 overflow-y-auto">
                      <div className="text-xs font-mono text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                        {previousRun.prompt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Observations Section */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleSection('observations')}
          className="w-full flex items-center justify-between p-4 hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
        >
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
            <span className="font-medium text-weave-light-primary dark:text-weave-dark-primary">
              {hasMultipleRuns ? 'Observations & Notes' : 'Initial Observations & Notes'}
            </span>
          </div>
          {expandedSections.observations ? (
            <ChevronUp className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.observations && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-weave-light-border dark:border-weave-dark-border"
            >
              <div className="p-4">
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  What did you observe about this run? <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={feedbackRef}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={hasMultipleRuns 
                    ? "How did the changes affect the output? What improved or got worse? What would you change next?"
                    : "Any insights, issues, or improvements to note? What worked well? What could be better?"
                  }
                  className="w-full h-32 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


    </div>
  );
}; 