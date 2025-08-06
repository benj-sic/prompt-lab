import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, TrendingUp, GitBranch, Copy, Check, MessageSquare } from 'lucide-react';
import { Experiment, ExperimentRun } from '../types';

interface ExperimentRunsProps {
  experiment: Experiment;
  onAddRun: (run: ExperimentRun) => void;
  onUpdateExperiment: (experiment: Experiment) => void;
  onRunExperiment: (run: ExperimentRun) => Promise<void>;
  onFinishExperiment?: () => void;
  isLoading: boolean;
  runParameters?: { temperature: number; maxTokens: number; model: string };
}

export const ExperimentRuns: React.FC<ExperimentRunsProps> = ({
  experiment,
  onAddRun,
  onUpdateExperiment,
  onRunExperiment,
  onFinishExperiment,
  isLoading,
  runParameters = { temperature: 0.7, maxTokens: 1000, model: 'gemini-1.5-flash' },
}) => {
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRunTab, setActiveRunTab] = useState(0);
  const [showIteratePrompt, setShowIteratePrompt] = useState(false);
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [iterationNotes, setIterationNotes] = useState('');
  const [runFeedback, setRunFeedback] = useState('');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleIterateClick = () => {
    setShowIteratePrompt(true);
  };

  const handleIterateConfirm = () => {
    const lastRun = experiment.runs[experiment.runs.length - 1];
    const nextRunNumber = experiment.runs.length + 1;
    
    const run: ExperimentRun = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: lastRun?.prompt || '',
      model: runParameters.model,
      temperature: runParameters.temperature,
      maxTokens: runParameters.maxTokens,
      output: '',
      runNotes: iterationNotes || `Run ${nextRunNumber}`,
    };

    onAddRun(run);
    onRunExperiment(run);
    setShowIteratePrompt(false);
    setIterationNotes('');
    setActiveRunTab(experiment.runs.length); // Switch to new tab
  };

  const handleAddRunNotes = (runId: string) => {
    setShowNotesPrompt(true);
    // You could store which run is being noted here
  };





  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };



  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
            {experiment.title || 'Experiment'}
          </h3>
          <p className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
            {experiment.runs.length} run{experiment.runs.length !== 1 ? 's' : ''} completed
            {selectedRuns.length > 0 && ` • ${selectedRuns.length} selected`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRuns.length === 2 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Compare Runs</span>
            </button>
          )}
          <button
            onClick={handleIterateClick}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gradient-to-r from-weave-light-accent to-weave-dark-accent text-white rounded-lg hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted transition-colors"
          >
            <GitBranch className="h-4 w-4" />
            <span>{isLoading ? 'Running...' : 'Iterate'}</span>
          </button>
          {experiment.runs.length >= 2 && (
            <button
              onClick={onFinishExperiment}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Finish & Analyze</span>
            </button>
          )}
        </div>
      </div>



      {/* Run Tabs */}
      <div className="space-y-4">
        {/* Tab Headers */}
        {experiment.runs.length > 0 && (
          <div className="flex space-x-1 bg-weave-light-surface dark:bg-weave-dark-surface p-1 rounded-lg border border-weave-light-border dark:border-weave-dark-border">
            {experiment.runs.map((run, index) => (
              <button
                key={run.id}
                onClick={() => setActiveRunTab(index)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md transition-all ${
                  activeRunTab === index
                    ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white'
                    : 'text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary'
                }`}
              >
                <span>Run {index + 1}</span>
                {run.output && <span className="text-xs">✓</span>}
                {!run.output && isLoading && <span className="text-xs animate-pulse">•</span>}
              </button>
            ))}
          </div>
        )}

        {/* Active Run Content */}
        {experiment.runs.length > 0 && (
          <motion.div
            key={activeRunTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-lg p-4"
          >
            {(() => {
              const run = experiment.runs[activeRunTab];
              if (!run) return null;

              return (
                <div className="space-y-4">
                  {/* Run Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
                        Run {activeRunTab + 1}
                      </h3>
                      {run.output && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          ✓ Completed
                        </span>
                      )}
                      {!run.output && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                          Running...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {run.output && (
                        <>
                          <button
                            onClick={() => handleAddRunNotes(run.id)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Add Notes</span>
                          </button>
                          <button
                            onClick={() => copyToClipboard(run.output)}
                            className="p-1 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </>
                      )}
                      {!run.output && (
                        <button
                          onClick={() => onRunExperiment(run)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors disabled:opacity-50"
                        >
                          <Play className="h-3 w-3" />
                          <span>Run</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Run Details */}
                  <div className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
                    {formatDate(run.timestamp)} • Model: {run.model} • Temp: {run.temperature} • Max Tokens: {run.maxTokens}
                  </div>

                  {/* Run Notes */}
                  {run.runNotes && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <strong className="text-xs text-blue-800 dark:text-blue-200">Notes:</strong>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{run.runNotes}</p>
                    </div>
                  )}

                  {/* Output */}
                  {run.output && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-weave-light-primary dark:text-weave-dark-primary">Output:</h4>
                      <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-3">
                        <div className="text-sm font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words">
                          {run.output}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt to Iterate */}
                  {run.output && activeRunTab === experiment.runs.length - 1 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        <strong>Ready to iterate?</strong> Adjust your prompt blocks or parameters and run again to see how changes affect the output.
                      </p>
                      <button
                        onClick={handleIterateClick}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-gradient-to-r from-weave-light-accent to-weave-dark-accent text-white rounded-lg hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted transition-colors"
                      >
                        <GitBranch className="h-4 w-4" />
                        <span>Create Next Iteration</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>

      {(!experiment.runs || experiment.runs.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No runs yet. Add your first run to start experimenting!</p>
        </div>
      )}

      {/* Iteration Prompt Modal */}
      <AnimatePresence>
        {showIteratePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary mb-4">
                Create Next Iteration
              </h3>
              <p className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary mb-4">
                What changes are you making in this iteration? Adjust your prompt blocks or parameters above, then describe what you're testing.
              </p>
              <textarea
                value={iterationNotes}
                onChange={(e) => setIterationNotes(e.target.value)}
                placeholder="e.g., Testing more specific persona, increased temperature to 0.9..."
                className="w-full h-20 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
              />
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowIteratePrompt(false)}
                  className="px-4 py-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIterateConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-weave-light-accent to-weave-dark-accent text-white rounded-lg hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted transition-colors"
                >
                  Run Iteration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary mb-4">
                Add Run Notes
              </h3>
              <p className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary mb-4">
                What did you observe about this run? Any insights or feedback?
              </p>
              <textarea
                value={runFeedback}
                onChange={(e) => setRunFeedback(e.target.value)}
                placeholder="e.g., Output was too formal, needs more creativity..."
                className="w-full h-20 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
              />
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowNotesPrompt(false)}
                  className="px-4 py-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Here you would save the notes to the run
                    console.log('Saving notes:', runFeedback);
                    setShowNotesPrompt(false);
                    setRunFeedback('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}; 