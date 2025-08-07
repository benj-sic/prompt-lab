import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Trash2, 
  Download, 
  X,
  Play,
  Clock,
  FileText,
  GitBranch,
  Calendar,
  Target,
  ChevronRight,
  ChevronDown
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

  const toggleComparison = (comparisonId: string) => {
    setCollapsedComparisons(prev => ({
      ...prev,
      [comparisonId]: !prev[comparisonId]
    }));
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
    
    let report = `# ${experiment.title || 'Untitled Experiment'}

## Experiment Overview

**Title:** ${experiment.title || 'Untitled'}
**Date:** ${new Date(experiment.timestamp).toLocaleDateString()}
**Total Runs:** ${experiment.runs.length}
**Objective:** ${experiment.hypothesis || experiment.objective || 'Not specified'}`;

    // Add Key Findings
    if (experiment.analysis?.keyFindings && experiment.analysis.keyFindings.length > 0) {
      report += `\n\n## Key Findings\n\n`;
      report += experiment.analysis.keyFindings.map(finding => `• ${finding}`).join('\n');
    }

    // Add Recommendations
    if (experiment.analysis?.recommendations && experiment.analysis.recommendations.length > 0) {
      report += `\n\n## Recommendations\n\n`;
      report += experiment.analysis.recommendations.map(rec => `• ${rec}`).join('\n');
    }

    // Add Comparisons
    if (comparisons.length > 0) {
      report += `\n\n## Comparisons\n\n`;
      comparisons.forEach(comparison => {
        report += `### Run ${comparison.run1Index} vs Run ${comparison.run2Index}\n\n`;
        report += `**Run ${comparison.run1Index} Output:**\n\`\`\`\n${comparison.run1.output || 'No output'}\n\`\`\`\n\n`;
        report += `**Run ${comparison.run2Index} Output:**\n\`\`\`\n${comparison.run2.output || 'No output'}\n\`\`\`\n\n`;
        report += `**Prompt Differences:**\n\n`;
        report += `Run ${comparison.run1Index} Prompt:\n\`\`\`\n${comparison.run1.prompt}\n\`\`\`\n\n`;
        report += `Run ${comparison.run2Index} Prompt:\n\`\`\`\n${comparison.run2.prompt}\n\`\`\`\n\n`;
        
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
        differentComponents.push({
          component: key,
          run1Content: content1,
          run2Content: content2
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
              <BookOpen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
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
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-3">
                Experiment Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p><strong>Title:</strong> {experiment.title || 'Untitled'}</p>
                  <p><strong>Date:</strong> {new Date(experiment.timestamp).toLocaleDateString()}</p>
                  <p><strong>Total Runs:</strong> {experiment.runs.length}</p>
                </div>
                <div>
                  <p><strong>Objective:</strong> {experiment.hypothesis || experiment.objective || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Key Findings */}
              {experiment.analysis?.keyFindings && experiment.analysis.keyFindings.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Key Findings
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {experiment.analysis.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recommendations */}
              {experiment.analysis?.recommendations && experiment.analysis.recommendations.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Recommendations
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {experiment.analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Comparisons */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
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
                          <h4 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
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
                              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">
                                    Run {comparison.run1Index}
                                  </h5>
                                  <div className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
                                    {new Date(comparison.run1.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="h-64 overflow-y-auto">
                                  <div className="text-sm font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words">
                                    {comparison.run1.output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Pane - Run 2 */}
                            <div className="space-y-3">
                              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">
                                    Run {comparison.run2Index}
                                  </h5>
                                  <div className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
                                    {new Date(comparison.run2.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="h-64 overflow-y-auto">
                                  <div className="text-sm font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words">
                                    {comparison.run2.output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Prompt Differences */}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                              Prompt Differences
                            </h5>
                            {(() => {
                              const differentComponents = getDifferentComponents(comparison.run1.prompt, comparison.run2.prompt);
                              return differentComponents.length > 0 ? (
                                <div className="space-y-4">
                                  {differentComponents.map((diff, index) => (
                                    <div key={index} className="border border-yellow-200 dark:border-yellow-600 rounded-lg p-3">
                                      <h6 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                                        {diff.component}
                                      </h6>
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Run {comparison.run1Index}:</p>
                                          <div className="bg-white dark:bg-gray-800 p-2 rounded border max-h-24 overflow-y-auto">
                                            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                              {diff.run1Content}
                                            </pre>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Run {comparison.run2Index}:</p>
                                          <div className="bg-white dark:bg-gray-800 p-2 rounded border max-h-24 overflow-y-auto">
                                            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                              {diff.run2Content}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-yellow-700 dark:text-yellow-300">
                                  <p className="text-sm">No differences found in prompt components</p>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Comparison Notes */}
                          {comparison.existingComparison?.notes && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                              <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                Comparison Notes
                              </h5>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                <p className="text-blue-700 dark:text-blue-300 text-sm">{comparison.existingComparison.notes}</p>
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
      experiment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      experiment.hypothesis.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.timestamp - a.timestamp); // Sort newest to oldest

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Notebook</h2>
        </div>
        <div className="flex items-center space-x-2">
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
        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Experiments */}
      <div className="space-y-4">
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>{searchTerm ? 'No experiments found matching your search.' : 'No experiments yet. Run your first experiment to see it here!'}</p>
          </div>
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

                    {experiment.version && (
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {experiment.version}
                        </span>
                      </div>
                    )}
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
                      setSelectedExperiment(experiment);
                      setShowDetailedView(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="View experiment details"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
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