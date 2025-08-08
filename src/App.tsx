import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FlaskConical, Play, TrendingUp, ArrowRight, ArrowLeft, GitBranch } from 'lucide-react';
import { PromptBuilder } from './components/PromptBuilder';
import { DualPaneRunComparison } from './components/DualPaneRunComparison';
import { ExperimentTreeVisualization } from './components/ExperimentTreeVisualization';
import { ApiErrorDisplay } from './components/ApiErrorDisplay';
import { LabNotebook } from './components/LabNotebook';
import { PageLoader } from './components/PageLoader';
import { ChangeImpactForm } from './components/ChangeImpactForm';
import { FinishExperimentModal } from './components/FinishExperimentModal';

import { IterationParameterControls } from './components/IterationParameterControls';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiService } from './services/api';
import { StorageService, ApiKeys } from './services/storage';
import { Experiment, ExperimentRun, ChangeMetadata, BlockChanges, PromptBlockState, LabNotebookEntry, ExperimentEvaluation as Evaluation, PromptBlock, RunComparison as RunComparisonType, ExperimentAnalysis, UploadedFile } from './types';
import { ThemeProvider } from './contexts/ThemeContext';


// Define the prompt blocks (same as in PromptBuilder)
const PROMPT_BLOCKS: PromptBlock[] = [
  {
    id: 'task',
    name: 'Task',
    description: 'What you want the AI to do',
    category: 'core',
    defaultContent: '',
    placeholder: 'Describe the specific regulatory writing task you want the AI to perform...',
    isRequired: true,
  },
  {
    id: 'persona',
    name: 'Persona / Role',
    description: 'Who the AI should act as',
    category: 'core',
    defaultContent: '',
    placeholder: 'Define the regulatory writing role or persona the AI should adopt...',
  },
  {
    id: 'context',
    name: 'Context / Background',
    description: 'Relevant information and context',
    category: 'core',
    defaultContent: '',
    placeholder: 'Provide the clinical or regulatory context that the AI should consider...',
  },
  {
    id: 'constraints',
    name: 'Constraints',
    description: 'Tone, format, length, and other limitations',
    category: 'core',
    defaultContent: '',
    placeholder: 'Specify the tone, format, length, and regulatory compliance requirements...',
  },
  {
    id: 'examples',
    name: 'Few-shot Examples',
    description: 'Example inputs and outputs to guide the AI',
    category: 'core',
    defaultContent: '',
    placeholder: 'Provide example inputs and expected outputs to guide the AI\'s response format...',
  },
  {
    id: 'format',
    name: 'Output Format',
    description: 'How the response should be structured',
    category: 'core',
    defaultContent: '',
    placeholder: 'Describe how you want the regulatory document structured and formatted...',
  },
  {
    id: 'instruction',
    name: 'Instruction Style',
    description: 'How to approach the task (step-by-step, etc.)',
    category: 'core',
    defaultContent: '',
    placeholder: 'Explain the step-by-step approach or methodology the AI should follow...',
  },
];

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
  const [activeTab, setActiveTab] = useState<'experiment' | 'handbook'>('experiment');
  const [showTreeView, setShowTreeView] = useState(false);

  // State for change tracking
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  
  // State for run parameters
  const [runParameters, setRunParameters] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gemini-1.5-flash'
  });
  
  const [lastRunParameters, setLastRunParameters] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gemini-1.5-flash'
  });
  const [selectedForkRunId, setSelectedForkRunId] = useState<string | null>(null);

  // Note: Fork run initialization is handled in the main useEffect below

  // Helper function to parse a prompt back into block states
  const parsePromptIntoBlocks = (prompt: string, shouldAutoExpand: boolean = false): PromptBlockState[] => {
    const blocks: PromptBlockState[] = [];
    
    // Split the prompt by double newlines to get block sections
    const sections = prompt.split('\n\n');
    
    sections.forEach(section => {
      const lines = section.split('\n');
      if (lines.length >= 2) {
        const blockNameLine = lines[0];
        const blockContent = lines.slice(1).join('\n');
        
        // Find matching block by name
        const matchingBlock = PROMPT_BLOCKS.find(block => 
          blockNameLine.includes(block.name) || blockNameLine.includes(block.id)
        );
        
        if (matchingBlock) {
          blocks.push({
            id: matchingBlock.id,
            content: blockContent,
            isCollapsed: !shouldAutoExpand,
          });
        }
      }
    });
    
    // For any blocks not found in the prompt, add them as not included
    PROMPT_BLOCKS.forEach(block => {
      if (!blocks.some(b => b.id === block.id)) {
        blocks.push({
          id: block.id,
          content: block.defaultContent,
          isCollapsed: !shouldAutoExpand,
        });
      }
    });
    
    return blocks;
  };

  // State for modular prompt building
  const [blockChanges, setBlockChanges] = useState<BlockChanges>({
    added: [],
    removed: [],
    modified: [],
  });
  const [currentBlockStates, setCurrentBlockStates] = useState<PromptBlockState[]>([]);

  // State for finish analysis
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // State for current workflow step
  const [workflowStep, setWorkflowStep] = useState<'building' | 'setup' | 'loading' | 'output' | 'evaluation' | 'iteration' | 'comparison'>('setup');
  const [experimentSetup, setExperimentSetup] = useState({
    title: '',
    objective: ''
  });

  // State for file uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // State for assembled prompt
  const [currentAssembledPrompt, setCurrentAssembledPrompt] = useState<string>('');

  // File upload handlers
  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  // State for current run output
  const [currentRunOutput, setCurrentRunOutput] = useState('');
  const [currentRun, setCurrentRun] = useState<ExperimentRun | null>(null);
  
  // State for API test
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // State for API errors
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State for tracking what has been changed (parameter or block)
  const [changedParameter, setChangedParameter] = useState<string | null>(null);
  const [changedBlock, setChangedBlock] = useState<string | null>(null);
  

  
  // State for tracking evaluation feedback
  const [evaluationFeedback, setEvaluationFeedback] = useState<string>('');
  
  // State for dual pane comparison
  const [comparisonNotes, setComparisonNotes] = useState<string>('');
  const [dualPaneSelectedForkRunId, setDualPaneSelectedForkRunId] = useState<string>('');
  


  


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
  const apiService = React.useMemo(() => new ApiService({
    provider: 'gemini',
    apiKey: apiKeys.gemini || undefined,
  }), [apiKeys.gemini]);

  // Monitor workflow step changes
  useEffect(() => {
  }, [workflowStep]);

  // Reset experiment state when switching to experiment tab if no experiment is active
  useEffect(() => {
    if (activeTab === 'experiment' && !currentExperiment) {
      // Reset to fresh experiment state
      setCurrentExperiment(null);
      setCurrentRun(null);
      setCurrentRunOutput('');
      setExperimentSetup({ title: '', objective: '' });
      setWorkflowStep('setup');
      setSelectedForkRunId(null);
      setComparisonNotes('');
      setDualPaneSelectedForkRunId('');
      setEvaluationFeedback('');
      setCurrentBlockStates([]);
      setRunParameters({
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gemini-1.5-flash'
      });
      setLastRunParameters({
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gemini-1.5-flash'
      });
    }
  }, [activeTab, currentExperiment]);

  // Clear dual pane state when experiment changes
  useEffect(() => {
    setComparisonNotes('');
    setDualPaneSelectedForkRunId('');
  }, [currentExperiment?.id]);

  // Clear dual pane state when workflow step changes to comparison
  useEffect(() => {
    if (workflowStep === 'comparison') {
      setDualPaneSelectedForkRunId('');
    }
  }, [workflowStep]);

  // Initialize parameters and prompt content when a fork run is selected
  useEffect(() => {
    if (selectedForkRunId && currentExperiment) {
      const forkRun = currentExperiment.runs.find(r => r.id === selectedForkRunId);
      if (forkRun) {
        // Update run parameters to match the fork run
        setRunParameters({
          model: forkRun.model,
          temperature: forkRun.temperature,
          maxTokens: forkRun.maxTokens,
        });
        
        // Update last run parameters to match the fork run (so changes can be detected)
        setLastRunParameters({
          model: forkRun.model,
          temperature: forkRun.temperature,
          maxTokens: forkRun.maxTokens,
        });

        // Parse the fork run's prompt to extract block states (auto-expand for iteration)
        const blockStates = parsePromptIntoBlocks(forkRun.prompt, true);
        
        setCurrentBlockStates([...blockStates]); // Initialize current states to match
        
        // Clear any existing change indicators since we're starting fresh from the fork
        setChangedParameter(null);
        setChangedBlock(null);
        

      }
    }
  }, [selectedForkRunId, currentExperiment]);

  const getNextVersion = (parentExperiment?: Experiment | null): string => {
    if (!parentExperiment) {
      return 'v1';
    }
    
    // Find all experiments based on this parent
    const childExperiments = experiments.filter(exp => exp.parentVersion === parentExperiment.id);
    return `v${childExperiments.length + 2}`;
  };

  const createNewExperiment = async () => {
    
    // Check for duplicate title
    const isDuplicateTitle = experiments.some(exp => 
      exp.title.toLowerCase().trim() === experimentSetup.title.toLowerCase().trim()
    );
    
    if (isDuplicateTitle) {
      alert('An experiment with this title already exists. Please choose a different title.');
      setWorkflowStep('setup');
      return;
    }
    
    // Store original prompt and block states for reset functionality
    const assembledPrompt = currentBlockStates
      .filter(block => block.content.trim() !== '')
      .map(block => {
        const blockConfig = PROMPT_BLOCKS.find((b: PromptBlock) => b.id === block.id);
        const blockName = blockConfig?.name || block.id;
        return `${blockName}:\n${block.content}`;
      })
      .join('\n\n');
    

    
    // Create experiment with user-provided title and objective
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleString();
    
    const firstRun: ExperimentRun = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: assembledPrompt,
      model: runParameters.model,
      temperature: runParameters.temperature,
      maxTokens: runParameters.maxTokens,
      output: '',
    };

    // Initialize notebook entry with experiment setup
    const initialNotebookEntry = `--- EXPERIMENT SETUP (${formattedDate}) ---
Title: ${experimentSetup.title}
Objective/Hypothesis: ${experimentSetup.objective}
Initial Parameters: ${runParameters.model}, temp: ${runParameters.temperature}, max tokens: ${runParameters.maxTokens}

--- INITIAL PROMPT ---
${assembledPrompt}

--- OBSERVATIONS ---
[Initial observations will be added after first run evaluation]`;

    const experiment: Experiment = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: experimentSetup.title,
      description: experimentSetup.objective,
      hypothesis: experimentSetup.objective,
      runs: [firstRun],
      notes: initialNotebookEntry,
      version: getNextVersion(selectedExperiment),
      parentVersion: selectedExperiment?.id,
      // New modular prompt building fields
      includedBlocks: currentBlockStates.filter(b => b.content.trim() !== '').map(b => b.id),
      blockContent: currentBlockStates.reduce((acc, block) => {
        acc[block.id] = block.content;
        return acc;
      }, {} as Record<string, string>),
      changesFromPrevious: blockChanges,
    };

    setCurrentExperiment(experiment);
    setCurrentRun(firstRun);
    
    // Set initial last run parameters
    setLastRunParameters(runParameters);
    
    // Start running the experiment - only save after successful completion
    setWorkflowStep('loading');
    setChangedParameter(null);
    await runExperimentRun(firstRun, experiment);
  };

  const runExperimentRun = async (run: ExperimentRun, experiment?: Experiment) => {
    const targetExperiment = experiment || currentExperiment;
    if (!targetExperiment) {
      console.error('No current experiment found');
      return;
    }

    setIsLoading(true);
    setCurrentRunOutput('');
    setApiError(null);
    setWorkflowStep('loading');

    try {
      if (!apiKeys.gemini) {
        console.error('No Gemini API key found');
        throw new Error('No Gemini API key found. Please add your API key to the .env file or use the settings. Get your free API key from: https://aistudio.google.com/');
      }

      // Use the assembled prompt that includes file content, or fall back to building from block states
      let finalPrompt = currentAssembledPrompt || (() => {
        // Build the prompt from current block states as fallback
        return currentBlockStates
          .filter(block => block.content.trim() !== '')
          .map(block => {
            // Get the block config to use the proper name
            const blockConfig = PROMPT_BLOCKS.find((b: PromptBlock) => b.id === block.id);
            const blockName = blockConfig?.name || block.id;
            return `${blockName}:\n${block.content}`;
          })
          .join('\n\n');
      })();

      console.log('Using assembled prompt:', !!currentAssembledPrompt);
      console.log('Final prompt length:', finalPrompt.length);
      console.log('Final prompt preview:', finalPrompt.substring(0, 300) + '...');

      // Apply run-specific tweaks
      if (run.blockTweaks) {
        Object.entries(run.blockTweaks).forEach(([blockId, tweak]) => {
          finalPrompt = finalPrompt.replace(new RegExp(`${blockId}:.*`, 'g'), `${blockId}: ${tweak}`);
        });
      }
      
      if (!finalPrompt.trim()) {
        throw new Error('No prompt content available. Please add content to at least one prompt component.');
      }
      
      const result = await Promise.race([
        apiService.runExperiment(
          finalPrompt, 
          run.model, 
          run.temperature, 
          run.maxTokens
        ),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]);

      // Update the run with the result
      const updatedRun: ExperimentRun = {
        ...run,
        output: result,
        prompt: finalPrompt,
      };

      
      const updatedExperiment: Experiment = {
        ...targetExperiment,
        runs: targetExperiment.runs.map(r => r.id === run.id ? updatedRun : r)
        // Don't add AI output to experiment notes - focus on observations instead
      };

      setCurrentExperiment(updatedExperiment);
      setCurrentRun(updatedRun);
      setCurrentRunOutput(result);

    // Auto-save the experiment after successful run
    StorageService.saveExperiment(updatedExperiment);
    setExperiments(prev => {
      const existingIndex = prev.findIndex(exp => exp.id === updatedExperiment.id);
      if (existingIndex >= 0) {
        // Update existing experiment
        const updated = [...prev];
        updated[existingIndex] = updatedExperiment;
        return updated;
      } else {
        // Add new experiment
        return [updatedExperiment, ...prev];
      }
    });


    // Move to evaluation step directly
    setWorkflowStep('evaluation');

    } catch (err) {
      console.error('Error in runExperimentRun:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setApiError(errorMessage);
      
      // Show error in the output area
      const errorRun: ExperimentRun = {
        ...run,
        output: `Error: ${errorMessage}`,
        prompt: run.prompt,
      };
      
      const errorExperiment: Experiment = {
        ...targetExperiment,
        runs: targetExperiment.runs.map(r => r.id === run.id ? errorRun : r),
      };
      
      setCurrentExperiment(errorExperiment);
      setCurrentRun(errorRun);
      setCurrentRunOutput(`Error: ${errorMessage}`);
      setWorkflowStep('evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvaluation = (evaluation: Evaluation) => {
    if (!currentExperiment || !currentRun) return;

    // Get run index for labeling
    const runIndex = currentExperiment.runs.findIndex(r => r.id === currentRun.id) + 1;

    // Update the current run with evaluation
    const updatedRuns = currentExperiment.runs.map(run => 
      run.id === currentRun.id
        ? { ...run, evaluation }
        : run
    );

    // Add observations to experiment notes
    const timestamp = new Date().toLocaleString();
    let noteEntry = '';
    
    if (runIndex === 1) {
      // First run - replace the placeholder with initial observations
      const currentNotes = currentExperiment.notes || '';
      const notesWithoutPlaceholder = currentNotes.replace(
        /--- OBSERVATIONS ---\n\[Initial observations will be added after first run evaluation\]/,
        `--- OBSERVATIONS ---\n\n--- Run ${runIndex} Observations (${timestamp}) ---\n${evaluation.feedback}`
      );
      noteEntry = notesWithoutPlaceholder;
    } else {
      // Subsequent runs - add to existing observations
      noteEntry = `\n\n--- Run ${runIndex} Observations (${timestamp}) ---\n${evaluation.feedback}`;
    }

    const updatedExperiment = {
      ...currentExperiment,
      runs: updatedRuns,
      notes: runIndex === 1 
        ? noteEntry 
        : (currentExperiment.notes || '') + noteEntry
    };

    setCurrentExperiment(updatedExperiment);
  };

  const getBlockName = useCallback((blockId: string) => {
    const block = PROMPT_BLOCKS.find(b => b.id === blockId);
    return block?.name || blockId;
  }, []);

  const handleParameterChange = useCallback((parameter: string) => {
    setChangedParameter(parameter);
    setChangedBlock(null); // Clear any block changes when parameter is changed
  }, []);

  const handleResetParameter = useCallback((parameter: string) => {
    setRunParameters(prev => ({
      ...prev,
      [parameter]: lastRunParameters[parameter as keyof typeof lastRunParameters]
    }));
    setChangedParameter(null);
  }, [lastRunParameters]);

  const handleBlockChange = useCallback((blockId: string | null) => {
    setChangedBlock(blockId);
    setChangedParameter(null); // Clear any parameter changes when block is changed
  }, []);

  const handleResetBlockContent = useCallback((blockId: string) => {
    if (!currentExperiment) return;
    
    let lastContent = '';
    
    // If we have a selected fork run, reset to that run's content
    if (selectedForkRunId) {
      const forkRun = currentExperiment.runs.find(r => r.id === selectedForkRunId);
      if (forkRun) {
        // Extract block content from fork run's prompt
        const promptLines = forkRun.prompt.split('\n\n');
        for (const line of promptLines) {
          if (line.startsWith(`${getBlockName(blockId)}:`)) {
            lastContent = line.substring(line.indexOf(':') + 1).trim();
            break;
          }
        }
      }
    } else {
      // No fork run selected - use the original logic
      if (currentExperiment.runs.length <= 1) {
        // First run - reset to original experiment content
        lastContent = currentExperiment.blockContent?.[blockId] || '';
      } else {
        // Subsequent runs - get content from previous run
        const previousRun = currentExperiment.runs[currentExperiment.runs.length - 2];
        // Extract block content from previous run's prompt
        const promptLines = previousRun.prompt.split('\n\n');
        for (const line of promptLines) {
          if (line.startsWith(`${getBlockName(blockId)}:`)) {
            lastContent = line.substring(line.indexOf(':') + 1).trim();
            break;
          }
        }
        // Fallback to original content if not found
        if (!lastContent) {
          lastContent = currentExperiment.blockContent?.[blockId] || '';
        }
      }
    }
    
    // Update current block states with the reset content
    setCurrentBlockStates(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content: lastContent }
        : block
    ));
    
    // Clear the changed block indicator
    setChangedBlock(null);
  }, [currentExperiment, selectedForkRunId, getBlockName]);



  // Helper function to validate if next run can proceed
  const getRunValidationStatus = () => {
    if (!currentExperiment) return { canRun: false, reason: 'No experiment active' };

    // For the first run of an experiment, don't require changes
    if (currentExperiment.runs.length === 0) {
      return { canRun: true, reason: '', changes: [] };
    }

    // If there are multiple runs, require a fork selection
    if (currentExperiment.runs.length > 1 && !selectedForkRunId) {
      return { canRun: false, reason: 'Please select a fork point to continue from', changes: [] };
    }

    // Track what changed from the last run
    const changes: string[] = [];
    
    // Determine the baseline parameters to compare against
    let baselineParameters = lastRunParameters;
    
    // If we have a selected fork run, use its parameters as the baseline
    if (selectedForkRunId && currentExperiment) {
      const forkRun = currentExperiment.runs.find(r => r.id === selectedForkRunId);
      if (forkRun) {
        baselineParameters = {
          model: forkRun.model,
          temperature: forkRun.temperature,
          maxTokens: forkRun.maxTokens,
        };
      }
    }
    
    // Check parameter changes against the baseline
    if (runParameters.temperature !== baselineParameters.temperature) {
      changes.push(`Temperature: ${baselineParameters.temperature} → ${runParameters.temperature}`);
    }
    if (runParameters.maxTokens !== baselineParameters.maxTokens) {
      changes.push(`Max Tokens: ${baselineParameters.maxTokens} → ${runParameters.maxTokens}`);
    }
    if (runParameters.model !== baselineParameters.model) {
      changes.push(`Model: ${baselineParameters.model} → ${runParameters.model}`);
    }
    
    // Check block content changes
    // If we have a selected fork run, compare against that run's content
    // Otherwise, compare against the experiment's original block content
    let baselineBlockStates: Record<string, string> = {};
    
    if (selectedForkRunId && currentExperiment) {
      const forkRun = currentExperiment.runs.find(r => r.id === selectedForkRunId);
      if (forkRun) {
        // Extract block content from the fork run's prompt using consistent parsing
        const forkBlockStates = parsePromptIntoBlocks(forkRun.prompt);
        forkBlockStates.forEach(block => {
          baselineBlockStates[block.id] = block.content;
        });
      }
    } else {
      baselineBlockStates = currentExperiment.blockContent || {};
    }
    
    // Use the most up-to-date block states for comparison
    const currentBlockStatesToUse = currentBlockStates;
    
    currentBlockStatesToUse.forEach(block => {
      const lastContent = baselineBlockStates[block.id] || '';
      if (block.content !== lastContent && block.content.trim() !== '') {
        changes.push(`${block.id} content modified`);
      }
    });
    
    // If we have a changed block indicator, trust it even if content comparison fails
    // This handles timing issues where the indicator is set but content hasn't updated yet
    if (changedBlock && !changes.some(change => change.includes(changedBlock))) {
      changes.push(`${changedBlock} content modified`);
    }
    

    
    // Validation logic
    if (changes.length > 1) {
      return { canRun: false, reason: 'Only one parameter can be changed at a time', changes };
    }
    
    if (changes.length === 0) {
      return { canRun: false, reason: '', changes };
    }

    return { canRun: true, reason: '', changes };
  };

  const handleNextRun = () => {
    const validation = getRunValidationStatus();
    
    if (!validation.canRun) {
      // Show user feedback about why they can't run
      alert(validation.reason);
      return;
    }

    // Reset changed parameter for next iteration
    setChangedParameter(null);

    // Create a new run based on the selected fork run (or latest if none selected)
    const forkRun = selectedForkRunId 
      ? currentExperiment!.runs.find(r => r.id === selectedForkRunId)
      : currentExperiment!.runs[currentExperiment!.runs.length - 1];
    
    if (!forkRun) {
      alert('Could not find the selected run to fork from');
      return;
    }

    const nextRun: ExperimentRun = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: forkRun.prompt, // Start with the fork run's prompt
      model: runParameters.model,
      temperature: runParameters.temperature,
      maxTokens: runParameters.maxTokens,
      output: '',
      runNotes: `Change: ${validation.changes?.[0] || 'Parameter modified'}`,
      // Branching fields
      parentRunId: selectedForkRunId || forkRun.id,
      branchName: `iteration-${Date.now()}`,
      changeDescription: validation.changes?.[0] || 'Parameter modified',
    };

    const updatedExperiment = {
      ...currentExperiment!,
      runs: [...currentExperiment!.runs, nextRun],
    };

    setCurrentExperiment(updatedExperiment);
    setCurrentRun(nextRun);
    
    // Auto-save the experiment with the new run
    StorageService.saveExperiment(updatedExperiment);
    setExperiments(prev => {
      const existingIndex = prev.findIndex(exp => exp.id === updatedExperiment.id);
      if (existingIndex >= 0) {
        // Update existing experiment
        const updated = [...prev];
        updated[existingIndex] = updatedExperiment;
        return updated;
      } else {
        // Add new experiment
        return [updatedExperiment, ...prev];
      }
    });

    
    // Update last run parameters
    setLastRunParameters(runParameters);
    
    // Go to loading step
    setWorkflowStep('loading');
    runExperimentRun(nextRun, updatedExperiment);
  };

  const handleFinishExperiment = () => {
    setShowFinishModal(true);
  };



  const handleFinishSubmit = (entry: LabNotebookEntry, insights: string) => {
    // Update the experiment with insights
    if (currentExperiment) {
      const updatedAnalysis: ExperimentAnalysis = {
        ...currentExperiment.analysis,
        insights: insights.split('\n').filter(line => line.trim()),
        runComparisons: currentExperiment.analysis?.runComparisons || [],
        timestamp: Date.now()
      };

      const updatedExperiment = {
        ...currentExperiment,
        analysis: updatedAnalysis
      };

      // Save the updated experiment
      StorageService.saveExperiment(updatedExperiment);
      setCurrentExperiment(updatedExperiment);
      
      // Update experiments list
      setExperiments(prev => {
        const existingIndex = prev.findIndex(exp => exp.id === updatedExperiment.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedExperiment;
          return updated;
        } else {
          return [updatedExperiment, ...prev];
        }
      });
    }
    
    // Save to lab notebook (would integrate with StorageService)
    console.log('Saving experiment summary to lab notebook:', entry);
    
    // Close modal and current experiment (ready for next one)
    setShowFinishModal(false);
    setCurrentExperiment(null);
    setCurrentRun(null);
    setCurrentRunOutput('');
    setExperimentSetup({ title: '', objective: '' });
    setWorkflowStep('setup');
    
    // Switch to lab notebook tab to show the finished experiment
    setActiveTab('handbook');
  };



  const handleChangeFormSubmit = (metadata: ChangeMetadata) => {
    setShowChangeForm(false);
    // If we have an existing experiment, add a new run to it
    // If we don't have an experiment, create a new one
    if (currentExperiment) {
      handleNextRun();
    } else {
      createNewExperiment();
    }
  };

  const handleDeleteExperiment = (id: string) => {
    console.log('Attempting to delete experiment:', id);
    console.log('Current experiments before delete:', experiments.length);
    
    StorageService.deleteExperiment(id);
    setExperiments(prev => {
      const filtered = prev.filter(exp => exp.id !== id);
      console.log('Experiments after delete:', filtered.length);
      return filtered;
    });
    
    // If we're deleting the current experiment, clear it
    if (currentExperiment?.id === id) {
      setCurrentExperiment(null);
      setCurrentRun(null);
      setExperimentSetup({ title: '', objective: '' });
      setWorkflowStep('setup');
    }
  };



  const handleSelectExperiment = (experiment: Experiment) => {
    setCurrentExperiment(experiment);
    setSelectedExperiment(experiment);
    
    // Clear any previous fork run selection to ensure no auto-selection
    setDualPaneSelectedForkRunId('');
    setSelectedForkRunId(null);
    
    // Determine the appropriate workflow step based on experiment state
    if (experiment.runs.length === 0) {
      // New experiment - go to building
      setWorkflowStep('building');
    } else if (experiment.runs.length === 1) {
      // Single run - go to evaluation
      setWorkflowStep('evaluation');
    } else {
      // Multiple runs - go to dual pane comparison
      setWorkflowStep('comparison');
    }
  };

  const handleResumeExperiment = (experiment: Experiment) => {
    setCurrentExperiment(experiment);
    setSelectedExperiment(experiment);
    
    // Clear any previous fork run selection to ensure no auto-selection
    setDualPaneSelectedForkRunId('');
    setSelectedForkRunId(null);
    
    // Always go to dual pane comparison for resuming experiments
    setWorkflowStep('comparison');
    
    // Switch to experiment tab
    setActiveTab('experiment');
  };

  const handleSaveComparison = (run1Id: string, run2Id: string, notes: string) => {
    if (!currentExperiment) return;
    
    // Create or update the analysis with the comparison
    const newComparison: RunComparisonType = {
      run1Id,
      run2Id,
      differences: [],
      similarityScore: 0,
      keyInsights: [],
      notes
    };
    
    const updatedAnalysis: ExperimentAnalysis = {
      ...currentExperiment.analysis,
      runComparisons: [
        ...(currentExperiment.analysis?.runComparisons?.filter(
          comp => !((comp.run1Id === run1Id && comp.run2Id === run2Id) ||
                   (comp.run1Id === run2Id && comp.run2Id === run1Id))
        ) || []),
        newComparison
      ],
      insights: currentExperiment.analysis?.insights || [],
      timestamp: Date.now()
    };
    
    // Add comparison notes to experiment notes
    const run1Index = currentExperiment.runs.findIndex(r => r.id === run1Id) + 1;
    const run2Index = currentExperiment.runs.findIndex(r => r.id === run2Id) + 1;
    const timestamp = new Date().toLocaleString();
    const comparisonEntry = `\n\n--- Comparison: Run ${run1Index} vs Run ${run2Index} (${timestamp}) ---\n${notes}`;
    
    const updatedExperiment = {
      ...currentExperiment,
      analysis: updatedAnalysis,
      notes: (currentExperiment.notes || '') + comparisonEntry
    };
    
    setCurrentExperiment(updatedExperiment);
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

  // Stable callback functions to prevent render loops
  const handleBlockStatesChange = useCallback((blockStates: PromptBlockState[]) => {
    setCurrentBlockStates(blockStates);
  }, []);

  const handleParametersChange = useCallback((params: { temperature: number; maxTokens: number; model: string }) => {
    setRunParameters(params);
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setRunParameters(prev => ({ ...prev, model }));
  }, []);

  const handleTemperatureChange = useCallback((temperature: number) => {
    setRunParameters(prev => ({ ...prev, temperature }));
  }, []);

  const handleMaxTokensChange = useCallback((maxTokens: number) => {
    setRunParameters(prev => ({ ...prev, maxTokens }));
  }, []);

  const handleBlockChanges = useCallback((changes: BlockChanges) => {
    setBlockChanges(changes);
  }, []);

  const handlePromptChange = useCallback((assembledPrompt: string) => {
    // Store the assembled prompt that includes file content
    console.log('handlePromptChange called with prompt length:', assembledPrompt.length);
    console.log('Prompt preview:', assembledPrompt.substring(0, 300) + '...');
    setCurrentAssembledPrompt(assembledPrompt);
  }, []);

  // Memoized previous run content to prevent re-calculations
  const previousRunContent = useMemo(() => {
    if (!currentExperiment || !selectedForkRunId) {
      return undefined;
    }
    // Get content from selected fork run
    const forkRun = currentExperiment.runs.find(r => r.id === selectedForkRunId);
    if (!forkRun) return undefined;
    
    const content: Record<string, string> = {};
    const promptLines = forkRun.prompt.split('\n\n');
    
    PROMPT_BLOCKS.forEach(block => {
      for (const line of promptLines) {
        if (line.startsWith(`${block.name}:`)) {
          content[block.id] = line.substring(line.indexOf(':') + 1).trim();
          break;
        }
      }
    });
    
    return content;
  }, [currentExperiment, selectedForkRunId]);

  // Memoized previous experiment to prevent new references
  const memoizedPreviousExperiment = useMemo(() => {
    return currentExperiment || undefined;
  }, [currentExperiment]);

  // Create a stable key for the PromptBuilder that includes block states
  const promptBuilderKey = useMemo(() => {
    // Include the fork run ID in the key so PromptBuilder re-mounts when fork run changes
    const key = selectedForkRunId ? `fork-${selectedForkRunId}` : 'default';
    return key;
  }, [selectedForkRunId]);

  const renderWorkflowStep = () => {
    switch (workflowStep) {
      case 'building':
        return (
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
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">Build Your Prompt</h3>
                  {!apiKeys.gemini && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                      ⚠️ No API key found. Add your Gemini API key to .env file
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        setApiTestStatus('testing');
                        try {
                          await apiService.runExperiment(
                            'Hello, please respond with "API test successful"',
                            'gemini-1.5-flash',
                            0.7,
                            50
                          );
                          setApiTestStatus('success');
                          setTimeout(() => setApiTestStatus('idle'), 3000);
                        } catch (error) {
                          console.error('API test failed:', error);
                          setApiTestStatus('error');
                          setTimeout(() => setApiTestStatus('idle'), 3000);
                        }
                      }}
                      disabled={apiTestStatus === 'testing'}
                      className={`px-3 py-1 text-xs rounded transition-all duration-300 ${
                        apiTestStatus === 'idle' 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : apiTestStatus === 'testing'
                          ? 'bg-yellow-500 text-white'
                          : apiTestStatus === 'success'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {apiTestStatus === 'idle' && 'Test API'}
                      {apiTestStatus === 'testing' && 'Testing...'}
                      {apiTestStatus === 'success' && 'Success!'}
                      {apiTestStatus === 'error' && 'Failed'}
                    </button>
                  </div>
                </div>

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
                onChange={handlePromptChange}
                previousExperiment={selectedExperiment || undefined}
                onBlockChanges={handleBlockChanges}
                onBlockStatesChange={handleBlockStatesChange}
                onParametersChange={handleParametersChange}
                onResetBlockContent={handleResetBlockContent}
                onBlockChange={handleBlockChange}
                onParameterChange={handleParameterChange}
                changedParameter={changedParameter}
                changedBlock={changedBlock}
                onFilesChange={handleFilesChange}
                uploadedFiles={uploadedFiles}
              />
            </motion.div>

            {/* Navigation and Run Buttons - Outside Prompt Builder */}
            {currentBlockStates.some(block => block.content.trim() !== '') && !currentExperiment && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setWorkflowStep('setup')}
                  className="flex items-center space-x-2 px-4 py-2 border border-weave-light-border dark:border-weave-dark-border text-weave-light-secondary dark:text-weave-dark-secondary rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Setup</span>
                </button>
                
                <button
                  onClick={createNewExperiment}
                  disabled={isLoading || !apiKeys.gemini}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-lg transition-all duration-300 text-lg font-medium ${
                    isLoading || !apiKeys.gemini
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-weave-light-accent dark:bg-weave-dark-accent hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Play className="h-6 w-6" />
                  <span>{isLoading ? 'Running...' : !apiKeys.gemini ? 'No API Key' : 'Start Experiment'}</span>
                </button>
              </div>
            )}
          </motion.div>
        );

      case 'setup':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Experiment Setup Form */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-weave-light-primary dark:text-weave-dark-primary mb-2">
                  Setup Your Experiment
                </h2>
                <p className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
                  First, define your experiment's purpose and goals, then you'll build your prompt
                </p>
              </div>

              <div className="space-y-6">
                {/* Experiment Title */}
                <div>
                  <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                    Experiment Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={experimentSetup.title}
                    onChange={(e) => setExperimentSetup(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a descriptive title for your regulatory writing experiment..."
                    className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText"
                  />
                  {experimentSetup.title.trim() && experiments.some(exp => 
                    exp.title.toLowerCase().trim() === experimentSetup.title.toLowerCase().trim()
                  ) && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      ⚠️ An experiment with this title already exists
                    </p>
                  )}
                </div>

                {/* Objective/Hypothesis */}
                <div>
                  <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                    Objective / Hypothesis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={experimentSetup.objective}
                    onChange={(e) => setExperimentSetup(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe what regulatory writing approach you want to test and what you expect to achieve..."
                    rows={4}
                    className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <div></div> {/* Empty space for centering */}

                  <button
                    onClick={() => setWorkflowStep('building')}
                    disabled={
                      !experimentSetup.title.trim() || 
                      !experimentSetup.objective.trim() || 
                      experiments.some(exp => 
                        exp.title.toLowerCase().trim() === experimentSetup.title.toLowerCase().trim()
                      )
                    }
                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                      experimentSetup.title.trim() && 
                      experimentSetup.objective.trim() && 
                      !experiments.some(exp => 
                        exp.title.toLowerCase().trim() === experimentSetup.title.toLowerCase().trim()
                      )
                        ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Build Prompt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 'loading':
        return (
          <motion.div 
            className="flex items-center justify-center min-h-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {apiError ? (
              <div className="w-full max-w-2xl">
                <ApiErrorDisplay
                  error={apiError}
                  onRetry={() => {
                    setApiError(null);
                    if (currentRun) {
                      runExperimentRun(currentRun);
                    }
                  }}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-weave-light-accentMuted dark:border-weave-dark-accentMuted border-t-weave-light-accent dark:border-t-weave-dark-accent mx-auto mb-4"></div>
                <h3 className="text-xl font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">
                  Running Experiment...
                </h3>
                <p className="text-weave-light-secondary dark:text-weave-dark-secondary">
                  Generating output with your prompt
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'output':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Output Display */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
                  Experiment Output
                </h3>
              </div>

              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-6">
                <div className="text-base leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                  {currentRunOutput || 'No output available'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 'evaluation':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Output with Evaluation */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
                  Experiment Results
                </h3>
                {currentExperiment && currentExperiment.runs.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleFinishExperiment}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Finish & Summarize</span>
                    </button>
                    {currentExperiment.runs.length > 1 && (
                      <button
                        onClick={() => setShowTreeView(!showTreeView)}
                        className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                          showTreeView
                            ? 'bg-weave-light-accent dark:bg-weave-dark-accent text-white'
                            : 'border border-weave-light-border dark:border-weave-dark-border text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>{showTreeView ? 'Hide' : 'Show'} Tree View</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Experiment Tree Visualization */}
              {showTreeView && currentExperiment && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ExperimentTreeVisualization
                    experiment={currentExperiment}
                    onRunSelect={(run) => {
                      // Could implement run selection behavior here
                    }}
                    onForkFromRun={(run) => {
                      setSelectedForkRunId(run.id);
                      setWorkflowStep('iteration');
                    }}
                    selectedRunId={selectedForkRunId || undefined}
                  />
                </motion.div>
              )}

              {currentExperiment && currentExperiment.runs.length > 1 ? (
                // Multiple runs - show dual pane comparison interface
                <DualPaneRunComparison
                  experiment={currentExperiment}
                  onSaveComparison={handleSaveComparison}
                  onSelectRunToFork={(runId) => {
                    setSelectedForkRunId(runId);
                    setWorkflowStep('iteration');
                  }}
                  onFinishExperiment={() => setShowFinishModal(true)}
                  canProceedToNextRun={true}
                  nextRunDisabledReason=""
                  // New props for external state management
                  comparisonNotes={comparisonNotes}
                  selectedForkRunId={dualPaneSelectedForkRunId}
                  onComparisonNotesChange={setComparisonNotes}
                  onForkRunChange={setDualPaneSelectedForkRunId}
                />
              ) : (
                // Single run - show simple evaluation
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Output and Prompt */}
                    <div className="space-y-4">
                      {/* Output */}
                      <div>
                        <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">Output</h4>
                        <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded-lg p-6 h-96 overflow-y-auto">
                          <div className="text-base leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap break-words font-sans">
                            {currentRunOutput}
                          </div>
                        </div>
                      </div>


                    </div>

                    {/* Right: Observations (full width) */}
                    <div>
                      <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary mb-2">Observations</h4>
                      <textarea
                        value={evaluationFeedback}
                        onChange={(e) => setEvaluationFeedback(e.target.value)}
                        placeholder="Describe your observations about the regulatory compliance, language quality, and areas for improvement..."
                        className="w-full h-96 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none"
                      />
                    </div>
                  </div>


                </>
              )}
            </motion.div>

            {/* Next Run Button - Outside Results Box */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  if (currentExperiment && currentExperiment.runs.length > 1) {
                    // Dual pane case - check for comparison notes and selected fork run
                    if (!comparisonNotes.trim()) {
                      alert('Please add comparison notes before proceeding.');
                      return;
                    }
                    if (!dualPaneSelectedForkRunId) {
                      alert('Please select which run to fork from.');
                      return;
                    }
                    // Proceed with the selected fork run
                    setSelectedForkRunId(dualPaneSelectedForkRunId);
                    setWorkflowStep('iteration');
                  } else {
                    // Single run case - check for evaluation feedback
                    if (currentRun && currentExperiment && evaluationFeedback.trim()) {
                      const evaluation: Evaluation = {
                        rating: 0,
                        quality: 'good',
                        feedback: evaluationFeedback.trim(),
                        tags: [],
                        timestamp: Date.now(),
                      };
                      handleSaveEvaluation(evaluation);
                      // Don't auto-select fork point - let user choose
                      setWorkflowStep('iteration');
                    }
                  }
                }}
                disabled={
                  currentExperiment && currentExperiment.runs.length > 1
                    ? !comparisonNotes.trim() || !dualPaneSelectedForkRunId
                    : !evaluationFeedback.trim()
                }
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-lg font-medium ${
                  (currentExperiment && currentExperiment.runs.length > 1
                    ? comparisonNotes.trim() && dualPaneSelectedForkRunId
                    : evaluationFeedback.trim())
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentExperiment && currentExperiment.runs.length > 1 ? (
                  <>
                    <GitBranch className="h-5 w-5" />
                    <span>Continue with Selected Run</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    <span>Iterate</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      case 'iteration':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Iteration Screen */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
                    Iterate Experiment
                  </h3>
                  {selectedForkRunId && currentExperiment && currentExperiment.runs.length > 1 && (() => {
                    const runIndex = currentExperiment.runs.findIndex(r => r.id === selectedForkRunId) + 1;
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
                          Forking from Run {runIndex}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedForkRunId(null);
                            setWorkflowStep('evaluation');
                          }}
                          className="text-xs text-weave-light-accent dark:text-weave-dark-accent hover:underline"
                        >
                          Change Fork Point
                        </button>
                      </div>
                    );
                  })()}
                  {!selectedForkRunId && currentExperiment && currentExperiment.runs.length > 1 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
                        No fork point selected
                      </div>
                      <button
                        onClick={() => setWorkflowStep('evaluation')}
                        className="text-xs text-weave-light-accent dark:text-weave-dark-accent hover:underline"
                      >
                        Select Fork Point
                      </button>
                    </div>
                  )}
                </div>
              </div>





              {/* Prompt Builder */}
              <div className="mb-6">
                              <PromptBuilder
                key={promptBuilderKey}
                value=""
                onChange={handlePromptChange}
                previousExperiment={memoizedPreviousExperiment}
                onBlockChanges={handleBlockChanges}
                onBlockStatesChange={handleBlockStatesChange}
                onParametersChange={handleParametersChange}
                onResetBlockContent={handleResetBlockContent}
                onBlockChange={handleBlockChange}
                onParameterChange={handleParameterChange}
                changedParameter={changedParameter}
                changedBlock={changedBlock}
                hideParameters={true}
                initialBlockStates={selectedForkRunId && currentExperiment ? 
                  parsePromptIntoBlocks(
                    currentExperiment.runs.find(r => r.id === selectedForkRunId)?.prompt || '',
                    true
                  ) : currentBlockStates}
                previousRunContent={previousRunContent}
                isForkMode={!!selectedForkRunId}
                onFilesChange={handleFilesChange}
                uploadedFiles={uploadedFiles}
              />
              </div>

              {/* Parameter Controls */}
              <div className="mb-6">
                <IterationParameterControls
                  model={runParameters.model}
                  temperature={runParameters.temperature}
                  maxTokens={runParameters.maxTokens}
                  onModelChange={handleModelChange}
                  onTemperatureChange={handleTemperatureChange}
                  onMaxTokensChange={handleMaxTokensChange}
                  changedParameter={changedParameter}
                  onParameterChange={handleParameterChange}
                  onResetParameter={handleResetParameter}
                  changedBlock={changedBlock}
                  lastRunParameters={lastRunParameters}
                  currentRunNumber={currentExperiment ? currentExperiment.runs.length + 1 : 1}
                  previousRunNumber={currentExperiment ? currentExperiment.runs.length : 1}
                />
              </div>


            </motion.div>

            {/* Action Buttons - Outside the main panel */}
            <motion.div 
              className="flex items-center justify-between mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <button
                onClick={() => setWorkflowStep('evaluation')}
                className="flex items-center space-x-2 px-4 py-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Evaluation</span>
              </button>
              
              <div className="flex flex-col items-end">
                {(() => {
                  const validation = getRunValidationStatus();
                  return (
                    <>
                      {!validation.canRun && (
                        <div className="text-xs text-red-600 dark:text-red-400 mb-2 text-right max-w-xs">
                          {validation.reason}
                        </div>
                      )}
                      <button
                        onClick={handleNextRun}
                        disabled={!validation.canRun}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          validation.canRun
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Run Next Iteration</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        );

      case 'comparison':
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Dual Pane Comparison Interface */}
            <motion.div 
              className="bg-weave-light-surface dark:bg-weave-dark-surface p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-weave-light-border dark:border-weave-dark-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-weave-light-primary dark:text-weave-dark-primary">
                  Experiment Comparison & Iteration
                </h3>
                {currentExperiment && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleFinishExperiment}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Finish & Summarize</span>
                    </button>
                  </div>
                )}
              </div>

              {currentExperiment && currentExperiment.runs.length > 1 ? (
                <DualPaneRunComparison
                  experiment={currentExperiment}
                  onSaveComparison={handleSaveComparison}
                  onSelectRunToFork={(runId) => {
                    setSelectedForkRunId(runId);
                    setWorkflowStep('iteration');
                  }}
                  onFinishExperiment={() => setShowFinishModal(true)}
                  canProceedToNextRun={true}
                  nextRunDisabledReason=""
                  // New props for external state management
                  comparisonNotes={comparisonNotes}
                  selectedForkRunId={dualPaneSelectedForkRunId}
                  onComparisonNotesChange={setComparisonNotes}
                  onForkRunChange={setDualPaneSelectedForkRunId}
                />
              ) : (
                <div className="text-center py-8 text-weave-light-secondary dark:text-weave-dark-secondary">
                  <p>This experiment doesn't have enough runs to compare.</p>
                  <button
                    onClick={() => setWorkflowStep('evaluation')}
                    className="mt-4 px-4 py-2 bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
                  >
                    Go to Evaluation
                  </button>
                </div>
              )}
            </motion.div>

            {/* Continue with Selected Fork Button */}
            {currentExperiment && currentExperiment.runs.length > 1 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => {
                    // Check for comparison notes and selected fork run
                    if (!comparisonNotes.trim()) {
                      alert('Please add comparison notes before proceeding.');
                      return;
                    }
                    if (!dualPaneSelectedForkRunId) {
                      alert('Please select which run to fork from.');
                      return;
                    }
                    // Proceed with the selected fork run
                    setSelectedForkRunId(dualPaneSelectedForkRunId);
                    setWorkflowStep('iteration');
                  }}
                  disabled={!comparisonNotes.trim() || !dualPaneSelectedForkRunId}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-lg font-medium ${
                    comparisonNotes.trim() && dualPaneSelectedForkRunId
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <GitBranch className="h-5 w-5" />
                  <span>Continue with Selected Run</span>
                </button>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
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
              <div className="relative">
                <svg width="40" height="40" viewBox="0 0 40 40" className="logo-svg">
                  <rect width="40" height="40" fill="var(--weave-background)" rx="2.5" ry="2.5"/>
                  <rect x="2.5" y="2.5" width="35" height="35" fill="none" stroke="var(--weave-accent)" stroke-width="1.875" rx="1.25" ry="1.25"/>
                  <text x="20" y="20" font-family="Inter, Arial, sans-serif" font-size="15" fill="var(--weave-accent)" font-weight="bold" text-anchor="middle" dominant-baseline="middle">PL</text>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-weave-light-primary dark:text-weave-dark-primary sm:text-5xl">Prompt Lab</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-weave-light-secondary dark:text-weave-dark-secondary mt-2">
            Run prompt experiments, track changes, and build your prompt engineering handbook
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
              onClick={() => setActiveTab('handbook')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] hover:scale-105 active:scale-95 ${
                activeTab === 'handbook'
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
          renderWorkflowStep()
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
                  onResumeExperiment={handleResumeExperiment}
                  onDelete={handleDeleteExperiment}
                  onExport={handleExport}
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
    
    {/* Debug Info - hidden for now, uncomment if needed for development */}
    {/* <DebugInfo 
      currentExperiment={currentExperiment}
      workflowStep={workflowStep}
      selectedForkRunId={selectedForkRunId}
    /> */}
    </ThemeProvider>
  );
}

export default App;
