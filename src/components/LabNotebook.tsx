import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  NotebookText, 
  Trash2, 
  Download, 
  X,
  Play,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  ChevronDown,
  Copy,
  CheckCheck
} from 'lucide-react';
import { Experiment, ExperimentRun, RunComparison } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface LabNotebookProps {
  experiments: Experiment[];
  onSelectExperiment: (experiment: Experiment) => void;
  onResumeExperiment: (experiment: Experiment) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}

interface DetailedExperimentViewProps {
  experiment: Experiment;
  isVisible: boolean;
  onClose: () => void;
  onResumeExperiment: (experiment: Experiment) => void;
  onExport: (experiment: Experiment) => void;
}

const DetailedExperimentView: React.FC<DetailedExperimentViewProps> = ({
  experiment,
  isVisible,
  onClose,
  onResumeExperiment,
  onExport,
}) => {
  const [collapsedComparisons, setCollapsedComparisons] = useState<Record<string, boolean>>({});
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const toggleComparison = (comparisonId: string) => {
    setCollapsedComparisons(prev => ({
      ...prev,
      [comparisonId]: !prev[comparisonId]
    }));
  };

  const handleCopyPrompt = () => {
    const finalPrompt = experiment.runs.length > 0 ? experiment.runs[experiment.runs.length - 1].prompt : '';
    navigator.clipboard.writeText(finalPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  // Generate human-readable report for export
  const generateHumanReadableReport = (experiment: Experiment) => {
    // Generate comparisons similar to the display
    const generateComparisonsForReport = () => {
      const comparisons: Array<{
        run1: ExperimentRun;
        run2: ExperimentRun;
        run1Index: number;
        run2Index: number;
        existingComparison?: RunComparison;
      }> = [];

      for (let i = 0; i < experiment.runs.length - 1; i++) {
        const run1 = experiment.runs[i];
        const run2 = experiment.runs[i + 1];
        
        const existingComparison = experiment.analysis?.runComparisons?.find(
          comp => (comp.run1Id === run1.id && comp.run2Id === run2.id) ||
                  (comp.run1Id === run2.id && comp.run2Id === run1.id)
        );

        comparisons.push({
          run1,
          run2,
          run1Index: i + 1,
          run2Index: i + 2,
          existingComparison
        });
      }

      return comparisons;
    };

    const comparisons = generateComparisonsForReport();
    
    // Get the final prompt from the most recent run
    const finalPrompt = experiment.runs.length > 0 ? experiment.runs[experiment.runs.length - 1].prompt : '';
    const finalRun = experiment.runs.length > 0 ? experiment.runs[experiment.runs.length - 1] : null;
    
    let report = `# ${experiment.title || 'Untitled Experiment'}

## Experiment Overview

**Title:** ${experiment.title || 'Untitled'}
**Objective:** ${experiment.hypothesis || experiment.objective || 'Not specified'}
**Total Runs:** ${experiment.runs.length}
**Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
${finalRun?.uploadedFiles?.length ? `**File Attached:** ${finalRun.uploadedFiles[0].name}`: ''}

## Final Prompt (Run ${experiment.runs.length})

${finalPrompt.split('\n\n').map(section => {
  if (!section.trim()) return '';
  const colonIndex = section.indexOf(':');
  if (colonIndex === -1) return section;
  const title = section.substring(0, colonIndex + 1);
  const content = section.substring(colonIndex + 1).trim();
  return `**${title}**\n${content}`;
}).join('\n\n')}

**Copy the prompt above to use in your production environment.**

---`;

        // Add Insights & Recommendations
    if (experiment.analysis?.insights && experiment.analysis.insights.length > 0) {
      report += `\n\n## Insights & Recommendations\n\n`;
      report += experiment.analysis.insights.map(insight => `• ${insight}`).join('\n');
    }

    // Add Comparisons
    if (comparisons.length > 0) {
      report += `\n\n## Comparisons\n\n`;
      comparisons.forEach(comparison => {
        report += `### Run ${comparison.run1Index} vs Run ${comparison.run2Index}\n\n`;
        report += `**Run ${comparison.run1Index} Output:**\n\`\`\`\n${comparison.run1.output || 'No output'}\n\`\`\`\n\n`;
        report += `**Run ${comparison.run2Index} Output:**\n\`\`\`\n${comparison.run2.output || 'No output'}\n\`\`\`\n\n`;
        report += `**Prompt Differences:**\n\n`;
        
        const differentComponents = getDifferentComponents(comparison.run1.prompt, comparison.run2.prompt);
        if (differentComponents.length > 0) {
          differentComponents.forEach(diff => {
            report += `**${diff.component}**\n\n`;
            report += `Run ${comparison.run1Index}:\n\`\`\`\n${diff.run1Content}\n\`\`\`\n\n`;
            report += `Run ${comparison.run2Index}:\n\`\`\`\n${diff.run2Content}\n\`\`\`\n\n`;
          });
        } else {
          report += `No differences found in prompt components.\n\n`;
        }
        
        if (comparison.existingComparison?.notes) {
          report += `**Comparison Notes:**\n${comparison.existingComparison.notes}\n\n`;
        }
        
        report += `---\n\n`;
      });
    }

    // Add All Runs
    report += `## All Runs\n\n`;
    experiment.runs.forEach((run, index) => {
      const runNumber = index + 1;
      const timestamp = new Date(run.timestamp).toLocaleString();
      const evaluation = run.evaluation;
      
      report += `### Run ${runNumber} (${timestamp})\n\n`;
      report += `**Parameters:**\n`;
      report += `- Model: ${run.model}\n`;
      report += `- Temperature: ${run.temperature}\n`;
      report += `- Max Tokens: ${run.maxTokens}\n`;
      if (run.parameterTweaks) {
        report += `- Additional Tweaks: ${JSON.stringify(run.parameterTweaks)}\n`;
      }
      if (run.branchName) {
        report += `- Branch: ${run.branchName}\n`;
      }
      if (run.changeDescription) {
        report += `- Changes: ${run.changeDescription}\n`;
      }
      report += `\n**Prompt:**\n\`\`\`\n${run.prompt}\n\`\`\`\n\n`;
      report += `**Output:**\n\`\`\`\n${run.output || 'No output'}\n\`\`\`\n\n`;
      
      if (evaluation) {
        report += `**Evaluation:**\n`;
        report += `- Rating: ${evaluation.rating}/5\n`;
        report += `- Quality: ${evaluation.quality}\n`;
        report += `- Feedback: ${evaluation.feedback}\n\n`;
      }
      
      report += `---\n\n`;
    });

    report += `---\n*Report generated on ${new Date().toLocaleString()}*`;

    return report;
  };

  const handleExportReport = () => {
    const report = generateHumanReadableReport(experiment);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.title || 'experiment'}-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  // Generate comparisons from experiment runs
  const generateComparisons = () => {
    const comparisons: Array<{
      id: string;
      run1: ExperimentRun;
      run2: ExperimentRun;
      run1Index: number;
      run2Index: number;
      existingComparison?: RunComparison;
    }> = [];

    // Generate sequential comparisons (Run 1 vs Run 2, Run 2 vs Run 3, etc.)
    for (let i = 0; i < experiment.runs.length - 1; i++) {
      const run1 = experiment.runs[i];
      const run2 = experiment.runs[i + 1];
      const comparisonId = `${run1.id}-${run2.id}`;
      
      // Find existing comparison data
      const existingComparison = experiment.analysis?.runComparisons?.find(
        comp => (comp.run1Id === run1.id && comp.run2Id === run2.id) ||
                (comp.run1Id === run2.id && comp.run2Id === run1.id)
      );

      comparisons.push({
        id: comparisonId,
        run1,
        run2,
        run1Index: i + 1,
        run2Index: i + 2,
        existingComparison
      });
    }

    return comparisons;
  };

  const comparisons = generateComparisons();



  // Function to extract different components
  const getDifferentComponents = (prompt1: string, prompt2: string) => {
    const components1 = prompt1.split('\n\n');
    const components2 = prompt2.split('\n\n');
    
    const differentComponents: Array<{
      component: string;
      run1Content: string;
      run2Content: string;
    }> = [];
    
    // Create a map of components by their first line (component name)
    const map1 = new Map();
    const map2 = new Map();
    
    components1.forEach(comp => {
      const firstLine = comp.split('\n')[0];
      if (firstLine) {
        map1.set(firstLine, comp);
      }
    });
    
    components2.forEach(comp => {
      const firstLine = comp.split('\n')[0];
      if (firstLine) {
        map2.set(firstLine, comp);
      }
    });
    
    // Find different components
    const allKeys = new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())]);
    
    allKeys.forEach(key => {
      const content1 = map1.get(key) || '';
      const content2 = map2.get(key) || '';
      
      if (content1 !== content2) {
        // Extract component name without colon and get content without the title line
        const componentName = key.replace(':', '').trim();
        const content1WithoutTitle = content1.split('\n').slice(1).join('\n').trim();
        const content2WithoutTitle = content2.split('\n').slice(1).join('\n').trim();
        
        differentComponents.push({
          component: componentName,
          run1Content: content1WithoutTitle,
          run2Content: content2WithoutTitle
        });
      }
    });
    
    return differentComponents;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-weave-light-surface dark:bg-weave-dark-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weave-light-border dark:border-weave-dark-border">
            <div className="flex items-center space-x-3">
              <NotebookText className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
              <h2 className="text-xl font-semibold text-weave-light-primary dark:text-weave-dark-primary">
                {experiment.title || 'Untitled Experiment'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Experiment Overview */}
            <div>
              <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Experiment Overview
              </h3>
              <div className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed space-y-2">
                <p><strong>Title:</strong> {experiment.title || 'Untitled'}</p>
                <p><strong>Objective:</strong> {experiment.hypothesis || experiment.objective || 'Not specified'}</p>
                <p><strong>Total Runs:</strong> {experiment.runs.length}</p>
                <p><strong>Date:</strong> {new Date(experiment.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Final Prompt */}
            {experiment.runs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary">
                    Final Prompt (Run {experiment.runs.length})
                  </h3>
                  <button
                    onClick={handleCopyPrompt}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none ${
                      copiedPrompt
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-lg hover:scale-105 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {copiedPrompt ? (
                      <CheckCheck className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    
                  </button>
                </div>
                <div className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {experiment.runs[experiment.runs.length - 1].prompt.split('\n\n').map((section, index) => {
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
            )}
            
            {/* Insights & Recommendations */}
            {experiment.analysis?.insights && experiment.analysis.insights.length > 0 && (
              <div>
                <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Insights & Recommendations
                </h3>
                <div className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed space-y-2">
                  {experiment.analysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparisons */}
            <div className="space-y-6">
              <h3 className="block text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                Comparisons ({comparisons.length})
              </h3>
              
              {comparisons.length === 0 ? (
                <div className="text-center py-8 text-weave-light-secondary dark:text-weave-dark-secondary">
                  <p>No comparisons available yet.</p>
                  <p className="text-sm mt-2">Need at least 2 runs to create comparisons.</p>
                </div>
              ) : (
                comparisons.map((comparison) => {
                  const isCollapsed = collapsedComparisons[comparison.id] !== false; // Default to collapsed
                  
                  return (
                    <div key={comparison.id} className="border border-weave-light-border dark:border-weave-dark-border rounded-lg">
                      {/* Comparison Header - Always Visible */}
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => toggleComparison(comparison.id)}>
                        <div className="flex items-center space-x-3">
                          <button className="text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <h4 className="text-base font-semibold text-weave-light-secondary dark:text-weave-dark-secondary">
                            Run {comparison.run1Index} vs Run {comparison.run2Index}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(comparison.run1.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Comparison Content - Collapsible */}
                      {!isCollapsed && (
                        <div className="px-4 pb-4 space-y-6">
                          {/* Two-Pane Output Display */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Pane - Run 1 */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">
                                  Run {comparison.run1Index}
                                </h5>
                                <div className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
                                  {new Date(comparison.run1.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-4">
                                <div className="h-64 overflow-y-auto">
                                  <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                                    {comparison.run1.output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Pane - Run 2 */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">
                                  Run {comparison.run2Index}
                                </h5>
                                <div className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
                                  {new Date(comparison.run2.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-4">
                                <div className="h-64 overflow-y-auto">
                                  <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                                    {comparison.run2.output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Prompt Differences */}
                          <div className="space-y-4">
                            <h5 className="font-medium text-weave-light-primary dark:text-weave-dark-primary mb-3">
                              Prompt Differences
                            </h5>
                            {(() => {
                              const differentComponents = getDifferentComponents(comparison.run1.prompt, comparison.run2.prompt);
                              return differentComponents.length > 0 ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div>
                                      <div className="w-full h-48 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto">
                                        {differentComponents.map((diff, index) => (
                                          <div key={index}>
                                            <span className="font-bold text-weave-light-primary dark:text-weave-dark-primary">
                                              {diff.component}:
                                            </span>
                                            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-1 mb-3">
                                              {diff.run1Content}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="w-full h-48 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto">
                                        {differentComponents.map((diff, index) => (
                                          <div key={index}>
                                            <span className="font-bold text-weave-light-primary dark:text-weave-dark-primary">
                                              {diff.component}:
                                            </span>
                                            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-1 mb-3">
                                              {diff.run2Content}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-weave-light-secondary dark:text-weave-dark-secondary">
                                  <p className="text-sm">No differences found in prompt components</p>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Comparison Notes */}
                          {comparison.existingComparison?.notes && (
                            <div className="space-y-3">
                              <h5 className="font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">
                                Comparison Notes
                              </h5>
                              <div className="p-3 border border-weave-light-border dark:border-weave-dark-border rounded">
                                <p className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">{comparison.existingComparison.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>



            {/* Centered Action Buttons */}
            {experiment.runs && experiment.runs.length > 0 && (
              <div className="flex justify-center space-x-4 pt-6 border-t border-weave-light-border dark:border-weave-dark-border">
                <button
                  onClick={() => {
                    onResumeExperiment(experiment);
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  <Play className="h-5 w-5" />
                  <span>Resume Experiment</span>
                </button>
                <button
                  onClick={handleExportReport}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  <Download className="h-5 w-5" />
                  <span>Export as Markdown</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const LabNotebook: React.FC<LabNotebookProps> = ({
  experiments,
  onSelectExperiment,
  onResumeExperiment,
  onDelete,
  onExport,
}) => {
  const [deleteModal, setDeleteModal] = useState<{
    isVisible: boolean;
    experimentId: string;
    experimentTitle: string;
  }>({
    isVisible: false,
    experimentId: '',
    experimentTitle: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [groupByClient, setGroupByClient] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };







  // Filter out empty experiments (no runs or runs with no output)
  const validExperiments = experiments.filter(experiment => {
    return experiment.runs && 
           experiment.runs.length > 0 && 
           experiment.runs.some(run => run.output && run.output.trim() !== '' && !run.output.startsWith('Error:'));
  });
  
  const allExperiments = validExperiments;
    
  const filteredExperiments = allExperiments
    .filter(experiment => 
      experiment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (experiment.client && experiment.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
      experiment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      experiment.hypothesis.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.timestamp - a.timestamp); // Sort newest to oldest

  const groupedExperiments = groupByClient
    ? filteredExperiments.reduce((acc, experiment) => {
        const client = experiment.client || 'Unassigned';
        if (!acc[client]) {
          acc[client] = [];
        }
        acc[client].push(experiment);
        return acc;
      }, {} as Record<string, Experiment[]>)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <NotebookText className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Notebook</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGroupByClient(prev => !prev)}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors ${
              groupByClient
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <span>Group by Client</span>
          </button>
          {experiments.length > validExperiments.length && (
            <button
              onClick={() => {
                if (window.confirm(`Found ${experiments.length - validExperiments.length} empty/invalid experiments. Clear all experiments from storage?`)) {
                  // Clear all experiments and reload
                  localStorage.removeItem('prompt-lab-experiments');
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors border border-red-300 dark:border-red-600 rounded"
            >
              <span>Clear All ({experiments.length - validExperiments.length} invalid)</span>
            </button>
          )}
          <button
            onClick={onExport}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>



      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search experiments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <NotebookText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Experiments */}
      <div className="space-y-4">
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <NotebookText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>{searchTerm ? 'No experiments found matching your search.' : 'No experiments yet. Run your first experiment to see it here!'}</p>
          </div>
        ) : groupByClient && groupedExperiments ? (
          Object.entries(groupedExperiments).map(([client, experiments]) => (
            <div key={client}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{client}</h3>
              <div className="space-y-4">
                {experiments.map((experiment) => (
                  <div
                    key={experiment.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedExperiment(experiment);
                      setShowDetailedView(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Experiment Header */}
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {experiment.title}
                          </h3>
                        </div>

                        {/* Experiment Meta */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(experiment.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{experiment.runs?.length || 0} runs</span>
                          </div>
                        </div>

                        {/* Objective */}
                        {(experiment.hypothesis || experiment.objective) && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Objective:</strong> {experiment.hypothesis || experiment.objective}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isVisible: true,
                              experimentId: experiment.id,
                              experimentTitle: experiment.title,
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete experiment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          filteredExperiments.map((experiment) => (
            <div
              key={experiment.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedExperiment(experiment);
                setShowDetailedView(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Experiment Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {experiment.title}
                    </h3>
                  </div>

                  {/* Experiment Meta */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(experiment.timestamp)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3" />
                      <span>{experiment.runs?.length || 0} runs</span>
                    </div>
                  </div>

                  {/* Objective */}
                  {(experiment.hypothesis || experiment.objective) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Objective:</strong> {experiment.hypothesis || experiment.objective}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({
                        isVisible: true,
                        experimentId: experiment.id,
                        experimentTitle: experiment.title,
                      });
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete experiment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Show invalid experiments if any */}
        {experiments.length > validExperiments.length && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Invalid Experiments ({experiments.length - validExperiments.length})
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
              These experiments have no valid runs and will be hidden from the main view:
            </p>
            <div className="space-y-2">
              {experiments
                .filter(exp => !validExperiments.some(valid => valid.id === exp.id))
                .map(experiment => (
                  <div
                    key={experiment.id}
                    className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700"
                  >
                    <div>
                      <span className="text-sm text-red-800 dark:text-red-200">
                        {experiment.title} - {experiment.runs?.length || 0} runs
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(experiment.id);
                      }}
                      className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      title="Delete invalid experiment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isVisible={deleteModal.isVisible}
        title="Delete Experiment"
        message={`Are you sure you want to delete "${deleteModal.experimentTitle}"? This action cannot be undone.`}
        onConfirm={() => {
          onDelete(deleteModal.experimentId);
          setDeleteModal({ isVisible: false, experimentId: '', experimentTitle: '' });
        }}
        onCancel={() => setDeleteModal({ isVisible: false, experimentId: '', experimentTitle: '' })}
      />

      {/* Detailed Experiment View Modal */}
      {selectedExperiment && (
        <DetailedExperimentView
          experiment={selectedExperiment}
          isVisible={showDetailedView}
          onClose={() => {
            setShowDetailedView(false);
            setSelectedExperiment(null);
          }}
          onResumeExperiment={onResumeExperiment}
          onExport={onExport}
        />
      )}
    </div>
  );
}; 