import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, NotebookPen, Check, Copy, CheckCheck } from 'lucide-react';
import { Experiment, LabNotebookEntry } from '../types';

interface FinishExperimentModalProps {
  isVisible: boolean;
  experiment: Experiment;
  onFinish: (entry: LabNotebookEntry, insights: string, client: string) => void;
  onCancel: () => void;
}

export const FinishExperimentModal: React.FC<FinishExperimentModalProps> = ({
  isVisible,
  experiment,
  onFinish,
  onCancel,
}) => {
  const [insights, setInsights] = useState('');
  const [client, setClient] = useState(experiment.client || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  // Get the final prompt from the most recent run
  const finalPrompt = experiment.runs.length > 0 ? experiment.runs[experiment.runs.length - 1].prompt : '';
  const finalRun = experiment.runs.length > 0 ? experiment.runs[experiment.runs.length - 1] : null;

  

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
- **Client:** ${client || 'Not specified'}
- **Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
- **Total Runs:** ${experiment.runs.length}
- **Objective:** ${experiment.hypothesis || experiment.description || 'Not specified'}
${finalRun?.uploadedFiles?.length ? `- **File Attached:** ${finalRun.uploadedFiles[0].name}` : ''}

## Final Prompt
\`\`\`
${finalPrompt}
\`\`\`

## Analysis Results
**Insights & Recommendations:**
${insights || 'No insights provided'}

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

    onFinish(entry, insights, client);
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
          className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weave-light-border dark:border-weave-dark-border">
            <div className="flex items-center space-x-3">
              <NotebookPen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
              <h2 className="text-xl font-semibold text-weave-light-primary dark:text-weave-dark-primary">
                Finish Experiment
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-weave-light-secondary dark:text-weave-light-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Experiment Info */}
            <div>
              <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Experiment Details
              </h3>
              <div className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed space-y-2">
                <p><strong>Title:</strong> {experiment.title || 'Untitled Experiment'}</p>
                <p><strong>Hypothesis/Objective:</strong> {experiment.hypothesis || 'No hypothesis specified'}</p>
                <p><strong>Runs:</strong> {experiment.runs.length}</p>
                <p><strong>Created:</strong> {new Date(experiment.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Client Name Input */}
            <div>
              <label className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm"
                placeholder="Enter client name (e.g., Acme Corp)"
              />
            </div>

            {/* Final Prompt Section */}
            {finalPrompt && (
              <div>
                <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Final Prompt
                </h3>
                <div className="relative">
                  <div className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-12">
                    {finalPrompt.split('\n\n').map((section, index) => {
                      if (!section.trim() || section.includes('[PDF STUDY REPORT:')) return null;
                      
                      const colonIndex = section.indexOf(':');
                      if (colonIndex === -1) return <div key={index} className="mb-2">{section}</div>;
                      
                      const title = section.substring(0, colonIndex + 1);
                      const content = section.substring(colonIndex + 1).trim();
                      
                      return (
                        <div key={index} className="mb-3">
                          <span className="font-bold text-weave-light-primary dark:text-weave-dark-primary">
                            {title}
                          </span>
                          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              </div>
            )}

            {/* Insights & Recommendations */}
            <div>
              <label className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Insights & Recommendations <span className="text-red-500">*</span>
              </label>
              <textarea
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm resize-none"
                placeholder="What were the main insights from this experiment? What worked well, what didn't, and what would you do differently next time?"
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
              disabled={isSubmitting || !insights.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-300 ${
                isSubmitting || !insights.trim()
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