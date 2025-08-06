import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, BookOpen, FlaskConical, Play } from 'lucide-react';
import { PromptBuilder } from './components/PromptBuilder';
import { ExperimentRuns } from './components/ExperimentRuns';

import { ExperimentLabNotebookEntry } from './components/ExperimentLabNotebookEntry';

import { LabNotebook } from './components/LabNotebook';
import { PageLoader } from './components/PageLoader';
import { ChangeImpactForm } from './components/ChangeImpactForm';
import { FinishExperimentModal } from './components/FinishExperimentModal';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiService } from './services/api';
import { StorageService, ApiKeys } from './services/storage';
import { Experiment, ExperimentRun, ChangeMetadata, BlockChanges, PromptBlockState, LabNotebookEntry } from './types';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // State for current experiment
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null);

  // State for experiment results
  const [isLoading, setIsLoading] = useState(false);


  // State for API configuration
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});

  // State for experiment history
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  // State for UI controls
  const [activeTab, setActiveTab] = useState<'experiment' | 'playbook'>('experiment');

  // State for change tracking
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // State for modular prompt building
  const [blockChanges, setBlockChanges] = useState<BlockChanges>({
    added: [],
    removed: [],
    modified: [],
  });
  const [currentBlockStates, setCurrentBlockStates] = useState<PromptBlockState[]>([]);


  
  // State for finish analysis
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // State for run parameters
  const [runParameters, setRunParameters] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gemini-1.5-flash'
  });

  // Load API keys and experiments on mount
  useEffect(() => {
    const loadedApiKeys = StorageService.loadApiKeys();
    setApiKeys(loadedApiKeys);
    
    const loadedExperiments = StorageService.loadExperiments();
    
    // Migrate old experiments to new structure
    const migratedExperiments = loadedExperiments.experiments.map(experiment => {
      // If experiment doesn't have runs array, it's an old experiment
      if (!experiment.runs) {
        return {
          ...experiment,
          runs: [],
          title: experiment.title || 'Legacy Experiment',
          description: experiment.description || '',
          hypothesis: experiment.hypothesis || '',
        };
      }
      return experiment;
    });
    
    setExperiments(migratedExperiments);
  }, []);

  // Initialize API service
  const apiService = new ApiService({
    provider: 'gemini',
    apiKey: apiKeys.gemini || undefined,
  });

  const getNextVersion = (parentExperiment?: Experiment | null): string => {
    if (!parentExperiment) {
      return 'v1';
    }
    
    // Find all experiments based on this parent
    const childExperiments = experiments.filter(exp => exp.parentVersion === parentExperiment.id);
    return `v${childExperiments.length + 2}`;
  };

  const createNewExperiment = async () => {
    // Create experiment with auto-generated title and first run
    const runNumber = selectedExperiment ? (experiments.filter(exp => exp.parentVersion === selectedExperiment.id).length + 2) : 1;
    const baseTitle = selectedExperiment?.title || 'Prompt Experiment';
    
    const firstRun: ExperimentRun = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: '',
      model: runParameters.model,
      temperature: runParameters.temperature,
      maxTokens: runParameters.maxTokens,
      output: '',
    };

    const experiment: Experiment = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: `${baseTitle} - Run ${runNumber}`,
      description: '',
      hypothesis: '',
      runs: [firstRun],
      notes: '',
      version: getNextVersion(selectedExperiment),
      parentVersion: selectedExperiment?.id,
      // New modular prompt building fields
      includedBlocks: currentBlockStates.filter(b => b.isIncluded).map(b => b.id),
      blockContent: currentBlockStates.reduce((acc, block) => {
        acc[block.id] = block.content;
        return acc;
      }, {} as Record<string, string>),
      changesFromPrevious: blockChanges,
    };

    StorageService.saveExperiment(experiment);
    setExperiments(prev => [experiment, ...prev]);
    setCurrentExperiment(experiment);
    
    // Automatically run the first run
    setIsLoading(true);
    try {
      if (!apiKeys.gemini) {
        throw new Error('No Gemini API key found. Please add your API key in settings.');
      }

      // Build the prompt from current block states
      const assembledPrompt = currentBlockStates
        .filter(block => block.isIncluded)
        .map(block => {
          const blockContent = experiment.blockContent?.[block.id] || block.content;
          return `${block.id}: ${blockContent}`;
        })
        .join('\n\n');

      const result = await apiService.runExperiment(
        assembledPrompt, 
        firstRun.model, 
        firstRun.temperature, 
        firstRun.maxTokens
      );

      // Update the run with the result
      const updatedRun: ExperimentRun = {
        ...firstRun,
        output: result,
        prompt: assembledPrompt,
      };

      const updatedExperiment: Experiment = {
        ...experiment,
        runs: [updatedRun],
      };

      setCurrentExperiment(updatedExperiment);
      StorageService.saveExperiment(updatedExperiment);
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
    
    setSelectedExperiment(null);
  };

  const runExperimentRun = async (run: ExperimentRun) => {
    if (!currentExperiment) return;

    setIsLoading(true);
    // Clear any previous errors

    try {
      if (!apiKeys.gemini) {
        throw new Error('No Gemini API key found. Please add your API key in settings.');
      }

      // Build the prompt from current block states
      const assembledPrompt = currentBlockStates
        .filter(block => block.isIncluded)
        .map(block => {
          const blockConfig = currentExperiment.blockContent?.[block.id] || block.content;
          return `${block.id}: ${blockConfig}`;
        })
        .join('\n\n');

      // Apply run-specific tweaks
      let finalPrompt = assembledPrompt;
      if (run.blockTweaks) {
        Object.entries(run.blockTweaks).forEach(([blockId, tweak]) => {
          finalPrompt = finalPrompt.replace(new RegExp(`${blockId}:.*`, 'g'), `${blockId}: ${tweak}`);
        });
      }

      const result = await apiService.runExperiment(
        finalPrompt, 
        run.model, 
        run.temperature, 
        run.maxTokens
      );

      // Update the run with the result
      const updatedRun: ExperimentRun = {
        ...run,
        output: result,
        prompt: finalPrompt,
      };

      const updatedExperiment: Experiment = {
        ...currentExperiment,
        runs: currentExperiment.runs.map(r => r.id === run.id ? updatedRun : r),
      };

      setCurrentExperiment(updatedExperiment);
      StorageService.saveExperiment(updatedExperiment);
      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };



  const handleChangeFormSubmit = (metadata: ChangeMetadata) => {
    setShowChangeForm(false);
    createNewExperiment();
  };

  const handleDeleteExperiment = (id: string) => {
    StorageService.deleteExperiment(id);
    setExperiments(prev => prev.filter(exp => exp.id !== id));
  };

  const handleSelectExperiment = (experiment: Experiment) => {
    setCurrentExperiment(experiment);
    setSelectedExperiment(experiment);
  };

  const handleExport = () => {
    const data = StorageService.exportExperiments();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-lab-experiments-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: string) => {
    const success = StorageService.importExperiments(data);
    if (success) {
      const loadedExperiments = StorageService.loadExperiments();
      setExperiments(loadedExperiments.experiments);
    }
  };

  const handleFinishExperiment = () => {
    setShowFinishModal(true);
  };

  const handleFinishSubmit = (entry: LabNotebookEntry) => {
    // Save to lab notebook (would integrate with StorageService)
    console.log('Saving experiment summary to lab notebook:', entry);
    
    // Close modal and current experiment (ready for next one)
    setShowFinishModal(false);
    setCurrentExperiment(null);
    setSelectedExperiment(null);
    
    // In a real implementation, we'd save to StorageService and navigate to lab notebook
  };

  return (
    <ThemeProvider>
      <PageLoader />
      <div className="min-h-screen bg-weave-light-background dark:bg-weave-dark-background transition-colors">
        <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-weave-light-accent dark:text-weave-dark-accent" />
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-weave-light-primary dark:text-weave-dark-primary sm:text-5xl">Prompt Lab</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-weave-light-secondary dark:text-weave-dark-secondary mt-2">
            Run prompt experiments, track changes, and build your prompt engineering playbook
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex space-x-1 bg-weave-light-surface dark:bg-weave-dark-surface p-1 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border">
            <button
              onClick={() => setActiveTab('experiment')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] hover:scale-105 active:scale-95 ${
                activeTab === 'experiment'
                  ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white'
                  : 'text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary'
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              <span>Experiment</span>
            </button>
            <button
              onClick={() => setActiveTab('playbook')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] hover:scale-105 active:scale-95 ${
                activeTab === 'playbook'
                  ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white'
                  : 'text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Lab Notebook</span>
            </button>
          </div>
        </motion.div>

        {activeTab === 'experiment' ? (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >


            {/* Prompt Builder */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">Build Your Prompt</h3>
                {currentBlockStates.some(block => block.isIncluded && block.content) && !currentExperiment && (
                  <button
                    onClick={createNewExperiment}
                    disabled={isLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isLoading 
                        ? 'bg-gradient-to-r from-weave-light-accent to-weave-dark-accent animate-pulse text-white' 
                        : 'bg-gradient-to-r from-weave-light-accent to-weave-dark-accent hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted text-white'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                    <span>{isLoading ? 'Running...' : 'Run'}</span>
                  </button>
                )}
              </div>
              {selectedExperiment && (
                <div className="mb-3 p-2 bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted border border-weave-light-accent dark:border-weave-dark-accent rounded-lg">
                  <p className="text-sm text-weave-light-primary dark:text-weave-dark-primary">
                    <strong>Iterating on:</strong> {selectedExperiment.version || 'v1'} - {selectedExperiment.title}
                  </p>
                </div>
              )}
              <PromptBuilder
                value=""
                onChange={() => {}}
                previousExperiment={selectedExperiment || undefined}
                onBlockChanges={setBlockChanges}
                onBlockStatesChange={setCurrentBlockStates}
                onParametersChange={setRunParameters}
              />
            </motion.div>

            {/* Current Experiment */}
            {currentExperiment && (
              <>
                {/* Experiment Runs */}
                <motion.div 
                  className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <ExperimentRuns
                    experiment={currentExperiment}
                    onAddRun={(run) => {
                      const updatedExperiment = {
                        ...currentExperiment,
                        runs: [...currentExperiment.runs, run],
                      };
                      setCurrentExperiment(updatedExperiment);
                      StorageService.saveExperiment(updatedExperiment);
                      setExperiments(prev => prev.map(exp => exp.id === updatedExperiment.id ? updatedExperiment : exp));
                    }}
                    onUpdateExperiment={(experiment) => {
                      setCurrentExperiment(experiment);
                      StorageService.saveExperiment(experiment);
                      setExperiments(prev => prev.map(exp => exp.id === experiment.id ? experiment : exp));
                    }}
                    onRunExperiment={runExperimentRun}
                    onFinishExperiment={handleFinishExperiment}
                    runParameters={runParameters}
                    isLoading={isLoading}
                  />
                </motion.div>



                {/* Lab Notebook Entry */}
                <motion.div 
                  className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <ExperimentLabNotebookEntry
                    experiment={currentExperiment}
                    onSave={(entry) => {
                      console.log('Saved lab notebook entry:', entry);
                    }}
                  />
                </motion.div>
              </>
            )}


          </motion.div>
        ) : (
          /* Lab Notebook Tab */
          <motion.div 
            className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LabNotebook
              experiments={experiments}
              onSelectExperiment={handleSelectExperiment}
              onDelete={handleDeleteExperiment}
              onExport={handleExport}
              onImport={handleImport}
            />
          </motion.div>
        )}
      </div>
    </div>

    {/* Change Impact Form Modal */}
    <ChangeImpactForm
      isVisible={showChangeForm}
      onSubmit={handleChangeFormSubmit}
      onCancel={() => setShowChangeForm(false)}
    />

    {/* Finish Experiment Modal */}
    {currentExperiment && (
      <FinishExperimentModal
        isVisible={showFinishModal}
        experiment={currentExperiment}
        onFinish={handleFinishSubmit}
        onCancel={() => setShowFinishModal(false)}
      />
    )}
    </ThemeProvider>
  );
}

export default App;
