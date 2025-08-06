import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Check } from 'lucide-react';
import { Experiment, LabNotebookEntry } from '../types';

interface FinishExperimentModalProps {
  isVisible: boolean;
  experiment: Experiment;
  onFinish: (entry: LabNotebookEntry) => void;
  onCancel: () => void;
}

export const FinishExperimentModal: React.FC<FinishExperimentModalProps> = ({
  isVisible,
  experiment,
  onFinish,
  onCancel,
}) => {
  const [title, setTitle] = useState(experiment.title || 'Experiment Summary');
  const [keyFindings, setKeyFindings] = useState('');
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidntWork, setWhatDidntWork] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const content = `
## Key Findings
${keyFindings}

## What Worked
${whatWorked}

## What Didn't Work
${whatDidntWork}

## Next Steps / Future Directions
${nextSteps}

## Experiment Details
- **Runs Completed:** ${experiment.runs.length}
- **Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
- **Blocks Used:** ${experiment.includedBlocks?.join(', ') || 'N/A'}
`.trim();

    const entry: LabNotebookEntry = {
      id: Date.now().toString(),
      title,
      content,
      category: 'takeaway',
      tags: ['experiment-summary', experiment.title?.toLowerCase().replace(/\s+/g, '-') || 'experiment'],
      timestamp: Date.now(),
      starred: false,
      relatedExperiments: [experiment.id],
    };

    onFinish(entry);
    setIsSubmitting(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weave-light-border dark:border-weave-dark-border">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
              <h2 className="text-xl font-semibold text-weave-light-primary dark:text-weave-dark-primary">
                Finish Experiment & Add to Lab Notebook
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Summary Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText"
                placeholder="e.g., Persona Testing Results - Safety Summaries"
              />
            </div>

            {/* Key Findings */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Key Findings
              </label>
              <textarea
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="What were the main discoveries or insights from this experiment?"
              />
            </div>

            {/* What Worked */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                What Worked Well
              </label>
              <textarea
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="Which approaches, prompts, or techniques produced good results?"
              />
            </div>

            {/* What Didn't Work */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                What Didn't Work / Challenges
              </label>
              <textarea
                value={whatDidntWork}
                onChange={(e) => setWhatDidntWork(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="What approaches failed or didn't produce the expected results?"
              />
            </div>

            {/* Next Steps */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Next Steps / Future Directions
              </label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="What should be tested next? What variations or improvements to try?"
              />
            </div>

            {/* Experiment Summary */}
            <div className="bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted p-4 rounded-lg">
              <h4 className="font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">
                Experiment Summary
              </h4>
              <div className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary space-y-1">
                <p><strong>Runs Completed:</strong> {experiment.runs.length}</p>
                <p><strong>Date:</strong> {new Date(experiment.timestamp).toLocaleDateString()}</p>
                <p><strong>Blocks Used:</strong> {experiment.includedBlocks?.join(', ') || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-weave-light-border dark:border-weave-dark-border">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-300 ${
                isSubmitting || !title.trim()
                  ? 'bg-weave-light-secondary dark:bg-weave-dark-secondary cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-weave-light-accent to-weave-dark-accent hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted text-white'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save to Lab Notebook'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};