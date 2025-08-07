import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { PromptBlock, PromptBlockState, Experiment, BlockChanges } from '../types';
import { getDemoPrompt } from '../utils/demoPrompts';


interface PromptBuilderProps {
  value: string;
  onChange: (value: string) => void;
  previousExperiment?: Experiment;
  onBlockChanges?: (changes: BlockChanges) => void;
  onBlockStatesChange?: (blockStates: PromptBlockState[]) => void;
  onParametersChange?: (params: { temperature: number; maxTokens: number; model: string }) => void;
  onResetBlockContent?: (blockId: string) => void;
  onBlockChange?: (blockId: string | null) => void;
  onParameterChange?: (parameter: string) => void;
  changedParameter?: string | null;
  changedBlock?: string | null;
  hideParameters?: boolean;
  previousRunContent?: Record<string, string>;
  initialBlockStates?: PromptBlockState[];
  isForkMode?: boolean;
}

// Define the prompt blocks (simplified to one section)
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

export const PromptBuilder: React.FC<PromptBuilderProps> = ({
  value,
  onChange,
  previousExperiment,
  onBlockChanges,
  onBlockStatesChange,
  onParametersChange,
  onResetBlockContent,
  onBlockChange,
  onParameterChange,
  changedParameter,
  changedBlock,
  hideParameters = false,
  previousRunContent,
  initialBlockStates,
  isForkMode = false,
}) => {
  const [blockStates, setBlockStates] = useState<PromptBlockState[]>([]);
  const [showParameters, setShowParameters] = useState(false);
  const initializedRef = useRef(false);
  const isUserEditRef = useRef(false);
  const previousInitialBlockStatesRef = useRef<PromptBlockState[]>([]);
  
  // Parameter state
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [model, setModel] = useState('gemini-1.5-flash');

  // Initialize block states - prevent rendering loops but allow updates
  useEffect(() => {
    // Skip if this is a user edit
    if (isUserEditRef.current) {
      isUserEditRef.current = false;
      return;
    }
    
    // If we have initialBlockStates prop, use them directly
    if (initialBlockStates && initialBlockStates.length > 0) {
      // Only update if the content has actually changed to prevent loops
      const hasContentChanged = blockStates.length === 0 || 
        initialBlockStates.some((newBlock, index) => {
          const currentBlock = blockStates[index];
          const previousBlock = previousInitialBlockStatesRef.current[index];
          
          // Check if this is a new block or if content has changed
          return !currentBlock || 
                 currentBlock.content !== newBlock.content ||
                 currentBlock.isIncluded !== newBlock.isIncluded ||
                 !previousBlock ||
                 previousBlock.content !== newBlock.content ||
                 previousBlock.isIncluded !== newBlock.isIncluded;
        });
      
      if (hasContentChanged) {
        setBlockStates([...initialBlockStates]);
        previousInitialBlockStatesRef.current = [...initialBlockStates];
        initializedRef.current = true;
      }
      return;
    }
    
    // Only initialize from other sources if not already initialized
    if (initializedRef.current) {
      return;
    }
    
    // Only fall back to other initialization if no initialBlockStates
    const initialStates: PromptBlockState[] = PROMPT_BLOCKS.map(block => {
      // If we have a previous experiment, try to restore block content
      if (previousExperiment?.blockContent?.[block.id]) {
        return {
          id: block.id,
          isIncluded: previousExperiment.includedBlocks?.includes(block.id) ?? false,
          content: previousExperiment.blockContent[block.id],
          isCollapsed: !isForkMode, // Auto-expand in fork mode
        };
      }
      
      // Otherwise, use default content
      return {
        id: block.id,
        isIncluded: block.isRequired || false,
        content: block.defaultContent,
        isCollapsed: !isForkMode, // Auto-expand in fork mode
      };
    });
    
    setBlockStates(initialStates);
    initializedRef.current = true;
  }, [initialBlockStates, previousExperiment, isForkMode, blockStates]);

  const getBlockConfig = useCallback((blockId: string) => {
    return PROMPT_BLOCKS.find(block => block.id === blockId);
  }, []);

  // Update the full prompt whenever block states change
  useEffect(() => {
    const includedBlocks = blockStates.filter(block => block.isIncluded);
    const promptText = includedBlocks
      .map(block => {
        const config = getBlockConfig(block.id);
        if (!config) return '';
        
        return `${config.name}:\n${block.content}`;
      })
      .filter(text => text.trim())
      .join('\n\n');
    
    onChange(promptText);
    
    // Only notify parent of block states if this is not an initialization
    // This prevents the endless loop when initialBlockStates are provided
    if (initializedRef.current) {
      onBlockStatesChange?.(blockStates);
    }
  }, [blockStates, onChange, onBlockStatesChange, getBlockConfig]);

  // Notify parent of parameter changes
  useEffect(() => {
    onParametersChange?.({ temperature, maxTokens, model });
  }, [temperature, maxTokens, model, onParametersChange]);

  const toggleBlock = (blockId: string) => {
    setBlockStates(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, isIncluded: !block.isIncluded }
        : block
    ));
  };

  const updateBlockContent = (blockId: string, content: string) => {
    // Don't allow changes if parameters are already changed
    if (changedParameter !== null) {
      return;
    }
    
    // Don't allow changes if a different block is already changed
    if (changedBlock !== null && changedBlock !== blockId) {
      return;
    }
    
    // Mark this as a user edit to prevent re-initialization
    isUserEditRef.current = true;
    
    const updatedBlockStates = blockStates.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    );
    
    setBlockStates(updatedBlockStates);
    
    // Check if the content is identical to the baseline content
    let baselineContent = '';
    
    // Determine baseline content based on the current context
    if (previousExperiment?.blockContent?.[blockId]) {
      baselineContent = previousExperiment.blockContent[blockId];
    } else if (initialBlockStates) {
      const initialBlock = initialBlockStates.find(block => block.id === blockId);
      baselineContent = initialBlock?.content || '';
    }
    
    // If content matches baseline, clear the changed block indicator
    if (content === baselineContent) {
      onBlockChange?.(null); // Clear the changed block indicator
    } else {
      onBlockChange?.(blockId); // Set the changed block indicator
    }
    
    // Immediately notify parent of the updated block states
    onBlockStatesChange?.(updatedBlockStates);
  };

  const toggleBlockCollapse = (blockId: string) => {
    setBlockStates(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, isCollapsed: !block.isCollapsed }
        : block
    ));
  };

  // Load demo prompt (only for initial building, not iterations)
  const loadDemoPrompt = () => {
    const demoPrompt = getDemoPrompt();
    
    const demoStates: PromptBlockState[] = blockStates.map(block => {
      const demoContent = demoPrompt[block.id as keyof typeof demoPrompt] || '';
      return {
        ...block,
        content: demoContent,
        isIncluded: demoContent !== '', // Include blocks that have demo content
        isCollapsed: demoContent === '', // Expand blocks that have demo content, collapse empty ones
      };
    });
    
    setBlockStates(demoStates);
  };

  return (
    <div className="space-y-2">
      {/* Prompt Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">Prompt Components</h4>
          {/* Demo button - only show for initial building (no previous experiment) */}
          {!previousExperiment && (
            <button
              onClick={loadDemoPrompt}
              className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-accent dark:hover:text-weave-dark-accent transition-colors"
            >
                              <span>Demo</span>
            </button>
          )}
        </div>
        <AnimatePresence>
          {blockStates.map((block) => {
            const config = getBlockConfig(block.id);
            if (!config) return null;

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-weave-light-border dark:border-weave-dark-border rounded-lg overflow-hidden"
              >
                <div className={`flex items-center justify-between p-3 bg-weave-light-surface dark:bg-weave-dark-surface ${
                  changedParameter ? 'opacity-50' : ''
                } ${
                  changedBlock === block.id ? 'border-l-4 border-l-weave-light-accent dark:border-l-weave-dark-accent bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted' : ''
                }`}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleBlock(block.id)}
                      disabled={changedParameter !== null}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        block.isIncluded 
                          ? 'bg-weave-light-accent dark:bg-weave-dark-accent border-weave-light-accent dark:border-weave-dark-accent text-white' 
                          : 'border-weave-light-border dark:border-weave-dark-border hover:border-weave-light-secondary dark:hover:border-weave-dark-secondary'
                      } ${changedParameter ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {block.isIncluded && <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">{config.name}</span>
                    {config.isRequired && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {changedBlock === block.id && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Changed
                      </span>
                    )}
                    {onResetBlockContent && (() => {
                      // Use previousRunContent if available, otherwise fall back to original experiment content
                      const referenceContent = previousRunContent?.[block.id] ?? previousExperiment?.blockContent?.[block.id] ?? '';
                      // In fork mode, always show reset buttons if reference content exists
                      // In regular mode, only show if content has changed
                      return referenceContent && (isForkMode || block.content !== referenceContent);
                    })() && (
                      <button
                        onClick={() => onResetBlockContent(block.id)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => toggleBlockCollapse(block.id)}
                      className="text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
                    >
                      {block.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {!block.isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3"
                  >
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      placeholder={config.placeholder}
                      disabled={changedParameter !== null || (changedBlock !== null && changedBlock !== block.id)}
                      className={`w-full h-24 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-weave-light-secondary dark:focus:ring-weave-dark-secondary bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none text-sm ${
                        (changedParameter !== null || (changedBlock !== null && changedBlock !== block.id)) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Model Parameters */}
      {!hideParameters && (
        <div className="space-y-3">
          <button
            onClick={() => setShowParameters(!showParameters)}
            className="flex items-center space-x-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
          >
            {showParameters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Model Parameters</span>
            <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
              (Temperature: {temperature}, Tokens: {maxTokens})
            </span>
          </button>
        
        <AnimatePresence>
          {showParameters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-surface dark:bg-weave-dark-surface"
            >
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    onParameterChange?.('model');
                  }}
                  disabled={changedBlock !== null}
                  className={`w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-weave-light-secondary dark:focus:ring-weave-dark-secondary bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText ${
                    changedBlock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              {/* Temperature Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary">
                    Creativity Level
                  </label>
                  <span className={`text-sm font-medium ${
                    temperature <= 0.3 ? 'text-green-600 dark:text-green-400' : 
                    temperature <= 0.7 ? 'text-blue-600 dark:text-blue-400' : 
                    temperature <= 1.0 ? 'text-orange-600 dark:text-orange-400' : 
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {temperature <= 0.3 ? 'Focused (Consistent)' : 
                     temperature <= 0.7 ? 'Balanced (Creative)' : 
                     temperature <= 1.0 ? 'Creative (Varied)' : 
                     'Very Creative (Unpredictable)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(parseFloat(e.target.value));
                    onParameterChange?.('temperature');
                  }}
                  disabled={changedBlock !== null}
                  className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
                    changedBlock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  <span>0 (Focused)</span>
                  <span>1 (Balanced)</span>
                  <span>2 (Creative)</span>
                </div>
                
                {/* Temperature Explanation */}
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Temperature</strong> controls randomness in responses. Lower values (0-0.3) give consistent, focused answers. 
                    Higher values (0.7-2.0) create more creative, varied responses. For most tasks, 0.7-1.0 works well.
                  </p>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Max Response Length: {maxTokens} tokens
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => {
                    setMaxTokens(parseInt(e.target.value));
                    onParameterChange?.('maxTokens');
                  }}
                  disabled={changedBlock !== null}
                  className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
                    changedBlock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  <span>100 (Short)</span>
                  <span>2000 (Medium)</span>
                  <span>4000 (Long)</span>
                </div>
                <p className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  Controls maximum response length. Higher values allow longer, more detailed responses.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      )}


    </div>
  );
}; 