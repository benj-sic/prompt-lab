import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Save, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Experiment, LabNotebookEntry } from '../types';
import { StorageService } from '../services/storage';

interface ExperimentLabNotebookEntryProps {
  experiment: Experiment;
  onSave: (entry: LabNotebookEntry) => void;
}

export const ExperimentLabNotebookEntry: React.FC<ExperimentLabNotebookEntryProps> = ({
  experiment,
  onSave,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [entry, setEntry] = useState({
    title: '',
    content: '',
    category: 'observation' as const,
    tags: '',
  });

  const generateLabNotebookEntry = () => {
    const completedRuns = (experiment.runs || []).filter(run => run.output);
    
    if (completedRuns.length < 2) {
      alert('Need at least 2 completed runs to generate a lab notebook entry');
      return;
    }

    const run1 = completedRuns[0];
    const run2 = completedRuns[1];
    
    // Generate title
    const title = `Experiment: ${experiment.title || 'Parameter Variation Study'}`;
    
    // Generate content following lab notebook best practices
    const content = `**Experiment Record**

**Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
**Experiment ID:** ${experiment.id}

**Hypothesis:**
${experiment.hypothesis || 'Not specified'}

**Objective:**
To understand how parameter variations affect AI output quality and characteristics.

**Methodology:**
- **Base Prompt:** Modular prompt with ${experiment.includedBlocks?.length || 0} components
- **Model:** ${run1.model}
- **Runs Conducted:** ${completedRuns.length}

**Experimental Setup:**

**Run 1 (Control):**
- Temperature: ${run1.temperature}
- Max Tokens: ${run1.maxTokens}
${Object.entries(run1.blockTweaks || {}).map(([block, tweak]) => `- ${block} Block: ${tweak}`).join('\n')}
${Object.entries(run1.parameterTweaks || {}).map(([param, value]) => `- ${param}: ${value}`).join('\n')}

**Run 2 (Variation):**
- Temperature: ${run2.temperature}
- Max Tokens: ${run2.maxTokens}
${Object.entries(run2.blockTweaks || {}).map(([block, tweak]) => `- ${block} Block: ${tweak}`).join('\n')}
${Object.entries(run2.parameterTweaks || {}).map(([param, value]) => `- ${param}: ${value}`).join('\n')}

**Results:**

**Run 1 Output:**
${run1.output}

**Run 2 Output:**
${run2.output}

**Analysis:**
${experiment.analysis ? `
**Similarity Score:** ${experiment.analysis.runComparisons[0]?.similarityScore || 'N/A'}/100

**Key Differences:**
${experiment.analysis.runComparisons[0]?.differences.map(diff => `- ${diff}`).join('\n') || 'No differences identified'}

**Key Insights:**
${experiment.analysis.runComparisons[0]?.keyInsights.map(insight => `- ${insight}`).join('\n') || 'No insights recorded'}

**Key Findings:**
${experiment.analysis.keyFindings.map(finding => `- ${finding}`).join('\n') || 'No findings recorded'}

**Recommendations:**
${experiment.analysis.recommendations.map(rec => `- ${rec}`).join('\n') || 'No recommendations recorded'}
` : 'No analysis performed yet'}

**Conclusions:**
[Add your conclusions about the parameter effects]

**Next Steps:**
[Add planned follow-up experiments]

**Notes:**
${experiment.notes || 'No additional notes'}`;

    setEntry({
      title,
      content,
      category: 'observation',
      tags: 'experiment, parameter-variation, modular-prompt, analysis',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (entry.title && entry.content) {
      const labNotebookEntry: LabNotebookEntry = {
        id: Date.now().toString(),
        title: entry.title,
        content: entry.content,
        category: entry.category,
        tags: entry.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        timestamp: Date.now(),
        starred: false,
        relatedExperiments: [experiment.id],
      };

      StorageService.saveLabNotebookEntry(labNotebookEntry);
      onSave(labNotebookEntry);
      setShowForm(false);
      setEntry({ title: '', content: '', category: 'observation', tags: '' });
    }
  };

  const getExperimentStatus = () => {
    const completedRuns = (experiment.runs || []).filter(run => run.output);
    const totalRuns = experiment.runs ? experiment.runs.length : 0;
    
    if (totalRuns === 0) return { status: 'No runs', color: 'text-gray-500' };
    if (completedRuns.length === 0) return { status: 'No completed runs', color: 'text-yellow-600' };
    if (completedRuns.length === 1) return { status: 'Single run completed', color: 'text-blue-600' };
    if (completedRuns.length >= 2) return { status: 'Ready for analysis', color: 'text-green-600' };
    return { status: 'Unknown', color: 'text-gray-500' };
  };

  const status = getExperimentStatus();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Lab Notebook Entry</h3>
          <p className={`text-sm ${status.color}`}>
            {status.status} • {experiment.runs ? experiment.runs.length : 0} run{(experiment.runs ? experiment.runs.length : 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={generateLabNotebookEntry}
          disabled={(experiment.runs || []).filter(run => run.output).length < 2}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors disabled:bg-weave-light-secondary"
        >
          <BookOpen className="h-4 w-4" />
          <span>Generate Entry</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border border-gray-300 rounded-md bg-gray-50"
        >
          <h4 className="text-md font-medium text-gray-900 mb-4">Lab Notebook Entry</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={entry.category}
                onChange={(e) => setEntry(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="observation">Observation</option>
                <option value="hypothesis">Hypothesis</option>
                <option value="methodology">Methodology</option>
                <option value="failure-analysis">Failure Analysis</option>
                <option value="insight">Insight</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={entry.content}
                onChange={(e) => setEntry(prev => ({ ...prev, content: e.target.value }))}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={entry.tags}
                onChange={(e) => setEntry(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="experiment, parameter-variation, modular-prompt..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save to Lab Notebook</span>
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Experiment Summary */}
      <div className="p-4 border border-gray-200 rounded-md bg-white">
        <h4 className="font-medium text-gray-900 mb-2">Experiment Summary</h4>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Title:</strong> {experiment.title || 'Untitled Experiment'}
          </div>
          <div>
            <strong>Hypothesis:</strong> {experiment.hypothesis || 'Not specified'}
          </div>
          <div>
            <strong>Runs:</strong> {experiment.runs ? experiment.runs.length : 0} total, {(experiment.runs || []).filter(r => r.output).length} completed
          </div>
          <div>
            <strong>Analysis:</strong> {experiment.analysis ? 'Completed' : 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
}; 