import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown, ChevronRight, Play, Minus } from 'lucide-react';
import { PromptBlock, PromptBlockState, Experiment, BlockChanges } from '../types';
import { getDemoPrompt } from '../utils/demoPrompts';

interface PromptBuilderProps {
  value: string;
  onChange: (value: string) => void;
  previousExperiment?: Experiment;
  onBlockChanges?: (changes: BlockChanges) => void;
  onBlockStatesChange?: (blockStates: PromptBlockState[]) => void;
  onParametersChange?: (params: { temperature: number; maxTokens: number; model: string }) => void;
}

// Define the core prompt blocks
const PROMPT_BLOCKS: PromptBlock[] = [
  {
    id: 'task',
    name: 'Task',
    description: 'What you want the AI to do',
    category: 'core',
    defaultContent: '',
    placeholder: 'Describe the specific task you want the AI to perform...',
    isRequired: true,
  },
  {
    id: 'persona',
    name: 'Persona / Role',
    description: 'Who the AI should act as',
    category: 'core',
    defaultContent: '',
    placeholder: 'You are a [role]. Act as a [specific persona]...',
  },
  {
    id: 'context',
    name: 'Context / Background',
    description: 'Relevant information and context',
    category: 'core',
    defaultContent: '',
    placeholder: 'Given the following context: [background information]...',
  },
  {
    id: 'constraints',
    name: 'Constraints',
    description: 'Tone, format, length, and other limitations',
    category: 'core',
    defaultContent: '',
    placeholder: 'Respond in a [tone] tone. Format as [format]. Keep it [length]...',
  },
  {
    id: 'examples',
    name: 'Few-shot Examples',
    description: 'Example inputs and outputs to guide the AI',
    category: 'advanced',
    defaultContent: '',
    placeholder: 'Example 1:\nInput: [example input]\nOutput: [example output]\n\nExample 2:...',
  },
  {
    id: 'format',
    name: 'Output Format',
    description: 'How the response should be structured',
    category: 'advanced',
    defaultContent: '',
    placeholder: 'Please respond in the following format:\n[detailed format specification]',
  },
  {
    id: 'instruction',
    name: 'Instruction Style',
    description: 'How to approach the task (step-by-step, etc.)',
    category: 'advanced',
    defaultContent: '',
    placeholder: 'Let\'s approach this step by step:\n1. [first step]\n2. [second step]...',
  },
];

export const PromptBuilder: React.FC<PromptBuilderProps> = ({
  value,
  onChange,
  previousExperiment,
  onBlockChanges,
  onBlockStatesChange,
  onParametersChange,
}) => {
  const [blockStates, setBlockStates] = useState<PromptBlockState[]>([]);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showParameters, setShowParameters] = useState(false);
  
  // Parameter state
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [model, setModel] = useState('gemini-1.5-flash');

  // Initialize block states
  useEffect(() => {
    const initialStates: PromptBlockState[] = PROMPT_BLOCKS.map(block => {
      // If we have a previous experiment, try to restore block content
      if (previousExperiment?.blockContent?.[block.id]) {
        return {
          id: block.id,
          isIncluded: previousExperiment.includedBlocks?.includes(block.id) ?? false,
          content: previousExperiment.blockContent[block.id],
          isCollapsed: false,
        };
      }
      
      // Otherwise, use default content
      return {
        id: block.id,
        isIncluded: block.isRequired || false,
        content: block.defaultContent,
        isCollapsed: false,
      };
    });
    
    setBlockStates(initialStates);
  }, [previousExperiment]);

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
    
    // Notify parent of block states
    onBlockStatesChange?.(blockStates);
  }, [blockStates, onChange, onBlockStatesChange]);

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
    setBlockStates(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    ));
  };

  const toggleBlockCollapse = (blockId: string) => {
    setBlockStates(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, isCollapsed: !block.isCollapsed }
        : block
    ));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const loadDemo = () => {
    const demoPrompt = getDemoPrompt();
    setBlockStates(prev => prev.map(block => ({
      ...block,
      content: demoPrompt[block.id as keyof typeof demoPrompt] || block.content,
      isIncluded: Boolean(demoPrompt[block.id as keyof typeof demoPrompt])
    })));
  };

  const getBlockConfig = (blockId: string) => {
    return PROMPT_BLOCKS.find(block => block.id === blockId);
  };

  const coreBlocks = blockStates.filter(block => {
    const config = getBlockConfig(block.id);
    return config?.category === 'core';
  });

  const advancedBlocks = blockStates.filter(block => {
    const config = getBlockConfig(block.id);
    return config?.category === 'advanced';
  });

  return (
    <div className="space-y-6">
      {/* Demo Section */}
      <div className="flex items-center space-x-3">
        <button
          onClick={loadDemo}
          className="px-4 py-2 bg-gradient-to-r from-weave-light-accent to-weave-dark-accent text-white rounded-lg hover:from-weave-light-accentMuted hover:to-weave-dark-accentMuted transition-all duration-300 flex items-center space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>Load Demo</span>
        </button>
        <span className="text-sm text-weave-light-secondary dark:text-weave-dark-secondary">
          Auto-fill with a complete working example
        </span>
      </div>

      {/* Core Blocks */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">Core Components</h4>
        <AnimatePresence>
          {coreBlocks.map((block) => {
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
                <div className="flex items-center justify-between p-3 bg-weave-light-surface dark:bg-weave-dark-surface">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        block.isIncluded 
                          ? 'bg-weave-light-accent dark:bg-weave-dark-accent border-weave-light-accent dark:border-weave-dark-accent text-white' 
                          : 'border-weave-light-border dark:border-weave-dark-border hover:border-weave-light-secondary dark:hover:border-weave-dark-secondary'
                      }`}
                    >
                      {block.isIncluded && <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">{config.name}</span>
                    {config.isRequired && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">Required</span>
                    )}

                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">{config.description}</span>

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
                      className="w-full h-24 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none text-sm"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Advanced Blocks - Collapsible */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary hover:text-weave-light-secondary dark:hover:text-weave-dark-secondary transition-colors"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>Advanced Components</span>
          <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">({advancedBlocks.length})</span>
        </button>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {advancedBlocks.map((block) => {
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
                    <div className="flex items-center justify-between p-3 bg-weave-light-surface dark:bg-weave-dark-surface">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleBlock(block.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            block.isIncluded 
                              ? 'bg-weave-light-accent dark:bg-weave-dark-accent border-weave-light-accent dark:border-weave-dark-accent text-white' 
                              : 'border-weave-light-border dark:border-weave-dark-border hover:border-weave-light-secondary dark:hover:border-weave-dark-secondary'
                          }`}
                        >
                          {block.isIncluded && <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">{config.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">{config.description}</span>
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
                          className="w-full h-24 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none text-sm"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Parameters Section */}
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
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                  <option value="gemini-pro">Gemini Pro (Balanced)</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Temperature: {temperature}
                  <span className="text-xs ml-2">
                    {temperature <= 0.3 ? '(Conservative)' : temperature <= 0.7 ? '(Balanced)' : '(Creative)'}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-weave-light-border dark:bg-weave-dark-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  <span>0.0 (Deterministic)</span>
                  <span>1.0 (Balanced)</span>
                  <span>2.0 (Creative)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-weave-light-border dark:bg-weave-dark-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  <span>100 (Short)</span>
                  <span>1000 (Medium)</span>
                  <span>4000 (Long)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy Button */}
      <div className="flex justify-end">
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-2 px-4 py-2 bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}; 