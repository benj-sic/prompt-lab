import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Check } from 'lucide-react';
import { Experiment, LabNotebookEntry } from '../types';

interface FinishExperimentModalProps {
  isVisible: boolean;
  experiment: Experiment;
  onFinish: (entry: LabNotebookEntry, keyFindings: string, recommendations: string) => void;
  onCancel: () => void;
}

export const FinishExperimentModal: React.FC<FinishExperimentModalProps> = ({
  isVisible,
  experiment,
  onFinish,
  onCancel,
}) => {
  const [keyFindings, setKeyFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Generate comprehensive report with proper structure
    const generateRunsSection = () => {
      return experiment.runs.map((run, index) => {
        const runNumber = index + 1;
        const timestamp = new Date(run.timestamp).toLocaleString();
        const evaluation = run.evaluation;
        
        return `## Run ${runNumber} (${timestamp})

**Parameters:**
- Model: ${run.model}
- Temperature: ${run.temperature}
- Max Tokens: ${run.maxTokens}

**Prompt:**
\`\`\`
${run.prompt}
\`\`\`

**Output:**
\`\`\`
${run.output || 'No output'}
\`\`\`

${evaluation ? `**Evaluation:**
- Rating: ${evaluation.rating}/5
- Quality: ${evaluation.quality}
- Feedback: ${evaluation.feedback}` : '**Evaluation:** Not provided'}

---`;
      }).join('\n\n');
    };

    const summaryContent = `## Overview
- **Title:** ${experiment.title || 'Untitled Experiment'}
- **Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
- **Total Runs:** ${experiment.runs.length}
- **Objective:** ${experiment.hypothesis || experiment.description || 'Not specified'}

## Analysis Results
**Key Findings:**
${keyFindings || 'No key findings provided'}

**Recommendations:**
${recommendations || 'No recommendations provided'}

## Experiment Notes
${experiment.notes || 'No observations recorded'}

## All Runs
${generateRunsSection()}`;

    const entry: LabNotebookEntry = {
      id: Date.now().toString(),
      title: `${experiment.title || 'Experiment'} - Summary`,
      content: summaryContent,
      category: 'takeaway',
      tags: ['experiment-summary', experiment.title?.toLowerCase().replace(/\s+/g, '-') || 'experiment'],
      timestamp: Date.now(),
      starred: false,
      relatedExperiments: [experiment.id],
    };

    onFinish(entry, keyFindings, recommendations);
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
          className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-xl shadow-2xl w-full max-w-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weave-light-border dark:border-weave-dark-border">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
              <h2 className="text-xl font-semibold text-weave-light-primary dark:text-weave-dark-primary">
                Finish Experiment
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
            {/* Experiment Info */}
            <div className="bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted p-4 rounded-lg">
              <h3 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">
                Experiment Details
              </h3>
              <div className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary space-y-1">
                <p><strong>Title:</strong> {experiment.title || 'Untitled Experiment'}</p>
                <p><strong>Runs:</strong> {experiment.runs.length}</p>
                <p><strong>Created:</strong> {new Date(experiment.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Key Findings */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Key Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="What were the main insights from this experiment? What worked well and what didn't?"
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Recommendations <span className="text-red-500">*</span>
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                placeholder="What would you do differently next time? What follow-up experiments should be conducted?"
              />
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
              disabled={isSubmitting || !keyFindings.trim() || !recommendations.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-300 ${
                isSubmitting || !keyFindings.trim() || !recommendations.trim()
                  ? 'bg-weave-light-secondary dark:bg-weave-dark-secondary cursor-not-allowed opacity-50'
                  : 'bg-weave-light-accent dark:bg-weave-dark-accent hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted text-white'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Finishing...' : 'Finish Experiment'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};