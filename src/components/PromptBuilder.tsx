import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X, Paperclip } from 'lucide-react';
import { PromptBlock, PromptBlockState, Experiment, BlockChanges, UploadedFile } from '../types';
import { getDemoPrompt } from '../utils/demoPrompts';

// Import PDF.js for PDF parsing
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PromptBuilderProps {
  value: string;
  onChange: (value: string) => void;
  previousExperiment?: Experiment;
  onBlockChanges?: (changes: BlockChanges) => void;
  onBlockStatesChange?: (blockStates: PromptBlockState[]) => void;
  onParametersChange?: (params: { temperature: number; maxTokens: number; model: string }) => void;
  onBlockChange?: (blockId: string | null) => void;
  onParameterChange?: (parameter: string) => void;
  onResetBlock?: (blockId: string) => void;
  changedParameter?: string | null;
  changedBlock?: string | null;
  hideParameters?: boolean;
  previousRunContent?: Record<string, string>;
  initialBlockStates?: PromptBlockState[];
  isForkMode?: boolean;
  onFilesChange?: (files: UploadedFile[]) => void;
  uploadedFiles?: UploadedFile[];
  resetTrigger?: number; // Add this to signal when reset occurs
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
  onBlockChange,
  onParameterChange,
  onResetBlock,
  changedParameter,
  changedBlock,
  hideParameters = false,
  previousRunContent,
  initialBlockStates,
  isForkMode = false,
  onFilesChange,
  uploadedFiles = [],
  resetTrigger = 0,
}) => {
  const [blockStates, setBlockStates] = useState<PromptBlockState[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [showParameters, setShowParameters] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(uploadedFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const [userHasEdited, setUserHasEdited] = useState(false);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  
  const initializedRef = useRef(false);
  const isUserEditRef = useRef(false);
  const previousInitialBlockStatesRef = useRef<PromptBlockState[]>([]);
  
  // Parameter state
  // const [temperature, setTemperature] = useState(0.7);
  // const [maxTokens, setMaxTokens] = useState(1000);
  // const [model, setModel] = useState('gemini-1.5-flash');

  // Initialize block states - prevent rendering loops but allow updates
  useEffect(() => {
    // Sync files state with uploadedFiles prop
    if (uploadedFiles && uploadedFiles.length !== files.length) {
      setFiles(uploadedFiles);
    }
  }, [uploadedFiles, files.length]);



  // Initialize block states and sync with parent state changes
  useEffect(() => {
    console.log('Initialization effect triggered');
    console.log('initialBlockStates:', initialBlockStates);
    console.log('isForkMode:', isForkMode);
    
    // Skip if this is a user edit
    if (isUserEditRef.current) {
      console.log('Skipping due to user edit');
      isUserEditRef.current = false;
      return;
    }
    
    // If we have initialBlockStates prop, always sync with them
    if (initialBlockStates && initialBlockStates.length > 0) {
      console.log('Syncing with initialBlockStates:', initialBlockStates);
      
      // Always update block states to match parent state
      const updatedBlockStates = initialBlockStates.map(block => ({
        ...block,
        isCollapsed: block.content.trim() === '' // Collapse if no content
      }));
      
      setBlockStates(updatedBlockStates);
      previousInitialBlockStatesRef.current = updatedBlockStates;
      initializedRef.current = true;
      return;
    }
    
    // Only initialize from other sources if not already initialized
    if (initializedRef.current) {
      console.log('Already initialized, skipping fallback initialization');
      return;
    }
    
    console.log('Using fallback initialization with previousExperiment:', previousExperiment);
    
    // Fall back to other initialization if no initialBlockStates
    const initialStates: PromptBlockState[] = PROMPT_BLOCKS.map(block => {
      // If we have a previous experiment, try to restore block content
      if (previousExperiment?.blockContent?.[block.id]) {
        const content = previousExperiment.blockContent[block.id];
        return {
          id: block.id,
          content: content,
          isCollapsed: content.trim() === '', // Collapse if no content
        };
      }
      
      // Otherwise, use default content
      return {
        id: block.id,
        content: block.defaultContent,
        isCollapsed: block.defaultContent.trim() === '', // Collapse if no content
      };
    });
    
    console.log('Setting block states from fallback initialization');
    setBlockStates(initialStates);
    initializedRef.current = true;
  }, [initialBlockStates, previousExperiment, isForkMode]);

  const getBlockConfig = useCallback((blockId: string) => {
    return PROMPT_BLOCKS.find(block => block.id === blockId);
  }, []);

  // Update the full prompt whenever block states change
  useEffect(() => {
    console.log('Building prompt with', blockStates.length, 'blocks and', files.length, 'files');
    const includedBlocks = blockStates.filter(block => block.content.trim() !== '');
    console.log('Included blocks:', includedBlocks.map(b => b.id));
    
    const promptText = includedBlocks
      .map(block => {
        const config = getBlockConfig(block.id);
        if (!config) return '';
        
        let content = block.content;
        
        // If this is the context block and we have uploaded files, include their content
        if (block.id === 'context' && files.length > 0) {
          console.log('Adding file content to context block');
          console.log('Files available:', files.map(f => f.name));
          console.log('isForkMode:', isForkMode);
                      const fileContent = files.map(file => 
              `${file.content || 'File content not available'}`
            ).join('\n\n');
          content = content + (content ? '\n\n' : '') + fileContent;
          console.log('File content added to context');
          console.log('Final context content length:', content.length);
          console.log('Context content preview:', content.substring(0, 500) + '...');
        } else if (block.id === 'context') {
          console.log('Context block found but no files');
          console.log('Files length:', files.length, 'isForkMode:', isForkMode);
        }
        
        return `${config.name}:\n${content}`;
      })
      .filter(text => text.trim())
      .join('\n\n');
    
    console.log('Final prompt length:', promptText.length);
    console.log('Prompt preview:', promptText.substring(0, 300) + '...');
    
    onChange(promptText);
    
    // Only notify parent of block states if this is not an initialization
    // This prevents the endless loop when initialBlockStates are provided
    if (initializedRef.current) {
      // onBlockStatesChange?.(blockStates);
    }
  }, [blockStates, onChange, onBlockStatesChange, getBlockConfig, files, isForkMode]);

  // Notify parent of parameter changes
  useEffect(() => {
    onParametersChange?.({ temperature, maxTokens, model });
  }, [temperature, maxTokens, model, onParametersChange]);



  const updateBlockContent = (blockId: string, content: string) => {
    // Don't allow changes if parameters are already changed (except in fork mode)
    if (changedParameter !== null && !isForkMode) {
      return;
    }
    
    // Don't allow changes if a different block is already changed (except in fork mode)
    if (changedBlock !== null && changedBlock !== blockId && !isForkMode) {
      return;
    }
    
    // Mark this as a user edit to prevent re-initialization
    isUserEditRef.current = true;
    
    // In fork mode, also mark that we've made user changes to prevent auto-reset
    if (isForkMode) {
      console.log('User edit in fork mode - preventing auto-reset');
      setUserHasEdited(true);
    }
    
    const updatedBlockStates = blockStates.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    );
    
    setBlockStates(updatedBlockStates);
    
    // Determine baseline content for change detection (same logic as reset button)
    let baselineContent = '';
    
    if (isForkMode && previousRunContent?.[blockId]) {
      // In fork mode, use the fork run content as baseline
      baselineContent = previousRunContent[blockId];
    } else if (isForkMode && initialBlockStates) {
      // Fallback: use initial block states from fork run
      const initialBlock = initialBlockStates.find(block => block.id === blockId);
      baselineContent = initialBlock?.content || '';
    } else if (previousExperiment?.blockContent?.[blockId]) {
      // Use original experiment content as baseline
      baselineContent = previousExperiment.blockContent[blockId];
    } else if (initialBlockStates) {
      // Use initial block states as baseline
      const initialBlock = initialBlockStates.find(block => block.id === blockId);
      baselineContent = initialBlock?.content || '';
    }
    
    // If content matches baseline, clear the changed block indicator
    if (content === baselineContent) {
      onBlockChange?.(null); // Clear the changed block indicator
      console.log(`Block ${blockId} content matches baseline, clearing changed indicator`);
    } else {
      onBlockChange?.(blockId); // Set the changed block indicator
      console.log(`Block ${blockId} content differs from baseline, setting changed indicator`);
    }
    
    // Immediately notify parent of the updated block states
    onBlockStatesChange?.(updatedBlockStates);
  };

  const toggleBlockCollapse = (blockId: string) => {
    const newBlockStates = blockStates.map(block =>
      block.id === blockId
        ? { ...block, isCollapsed: !block.isCollapsed }
        : block
    );
    setBlockStates(newBlockStates);
    onBlockStatesChange?.(newBlockStates);
  };

  // File upload handlers
  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    console.log('handleFileUpload called with', uploadedFiles.length, 'files');
    const newFiles: UploadedFile[] = [];
    
    // Only process the first file (limit to one file at a time)
    const file = Array.from(uploadedFiles)[0];
    if (!file) return;
    
    console.log('Processing file:', file.name, 'Type:', file.type);
    
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    try {
      let content = '';
      
      // Read file content for text files
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
        console.log('Read text file:', file.name, 'Content length:', content.length);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Parse PDF using pdfjs-dist for actual text extraction
        setIsParsingPDF(true);
        try {
          content = await parsePDFFile(file);
          console.log('PDF parsed successfully:', file.name, 'Content length:', content.length);
        } catch (parseError) {
          console.error('PDF parsing failed:', parseError);
          content = `[PDF STUDY REPORT: ${file.name}]\n\nError: Failed to parse PDF content. ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`;
        } finally {
          setIsParsingPDF(false);
        }
      } else {
        content = `[File: ${file.name}] - Unsupported file type. Please use TXT or PDF format.`;
        console.log('Unsupported file type:', file.name);
      }
      
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        content: content,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        content: `[Error reading file: ${file.name}]`,
      });
    }

    // Replace existing files with the new file (single file upload)
    console.log('Setting files to:', newFiles.length, 'files');
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFileUpload(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    
    // Reset the file input so it can accept the same file again
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to parse PDF files using pdfjs-dist
  const parsePDFFile = async (file: File): Promise<string> => {
    try {
      console.log('Starting PDF parsing for:', file.name);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log('PDF loaded successfully. Pages:', pdf.numPages);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }
      
      console.log('PDF parsing completed. Total text length:', fullText.length);
      return fullText.trim();
      
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load demo prompt (only for initial building, not iterations)
  const loadDemoPrompt = () => {
    const demoPrompt = getDemoPrompt();
    
    const demoStates: PromptBlockState[] = blockStates.map(block => {
      const demoContent = demoPrompt[block.id as keyof typeof demoPrompt] || '';
      return {
        ...block,
        content: demoContent,
        isCollapsed: block.id === 'context' ? false : demoContent.trim() === '', // Keep context expanded, collapse others if no content
      };
    });
    
    setBlockStates(demoStates);
    onBlockStatesChange?.(demoStates);
    
    // Automatically create and upload the mock study report
    const mockStudyReport: UploadedFile = {
      id: 'demo-mock-report',
      name: 'Mock_IND_Study_Report_v2.pdf',
      size: 45000, // Approximate size
      type: 'application/pdf',
      content: `[PDF STUDY REPORT: Mock_IND_Study_Report_v2.pdf]`
    };
    
    // Set the mock file
    setFiles([mockStudyReport]);
    onFilesChange?.([mockStudyReport]);
  };

  return (
    <div className="space-y-2">
      {/* Prompt Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">Prompt Components</h4>
          {/* Demo button - only show for initial building (no previous experiment and not in fork mode) */}
          {!previousExperiment && !isForkMode && (
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
                    <span className="text-sm font-medium text-weave-light-primary dark:text-weave-dark-primary">{config.name}</span>
                    {config.isRequired && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">

                    {(() => {
                      // Simplified logic: show reset button if we have reference content and content has changed
                      // This matches the parameter reset button logic
                      
                      // Determine the baseline content to compare against
                      let baselineContent = '';
                      
                      if (isForkMode && previousRunContent?.[block.id]) {
                        // In fork mode, use the fork run content as baseline
                        baselineContent = previousRunContent[block.id];
                      } else if (isForkMode && initialBlockStates) {
                        // Fallback to initial block states
                        const initialBlock = initialBlockStates.find(b => b.id === block.id);
                        baselineContent = initialBlock?.content || '';
                      }
                      
                      // Show reset button if content has changed from baseline
                      const hasChanged = baselineContent && block.content !== baselineContent;
                      
                      if (!hasChanged) return null;
                      
                      return (
                        <button
                          onClick={() => {
                            // Always use the parent's reset handler for proper state management
                            if (onResetBlock) {
                              onResetBlock(block.id);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Reset
                        </button>
                      );
                    })()}
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
                    <div className="relative">
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        placeholder={config.placeholder}
                        disabled={changedParameter !== null || (changedBlock !== null && changedBlock !== block.id)}
                        className={`w-full h-24 px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-weave-light-secondary dark:focus:ring-weave-dark-secondary bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText resize-none text-sm leading-relaxed ${
                          (changedParameter !== null || (changedBlock !== null && changedBlock !== block.id)) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => {
                          setIsDragOver(false);
                        }}
                        onDrop={handleFileDrop}
                      />
                      {isDragOver && (
                        <div className="absolute inset-0 bg-weave-light-accent/20 dark:bg-weave-dark-accent/20 z-10 flex items-center justify-center">
                          <p className="text-lg text-weave-light-accent dark:text-weave-dark-accent">Drop files here</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Paperclip icon and file upload display - Only show for context block during initial building */}
                    {block.id === 'context' && !isForkMode && (
                      <div className="flex items-center justify-between mt-2">
                        {/* Uploaded file display as colored text on the left */}
                        <div className="flex items-center space-x-2">
                          {files.map((file) => (
                            <div key={file.id} className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-weave-light-accent dark:text-weave-dark-accent">
                                {file.name} ({formatFileSize(file.size)})
                              </span>
                              <button
                                onClick={() => removeFile(file.id)}
                                className="text-weave-light-secondary dark:text-weave-dark-secondary hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Paperclip icon on the right */}
                        <label className="cursor-pointer">
                          <Paperclip className={`h-4 w-4 transition-colors ${
                            files.length > 0 
                              ? 'text-weave-light-accent dark:text-weave-light-accent' 
                              : 'text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-accent dark:hover:text-weave-dark-accent'
                          }`} />
                          <input
                            type="file"
                            accept=".txt,.pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                        
                        {/* PDF parsing loading indicator */}
                        {isParsingPDF && (
                          <div className="mt-2 flex items-center space-x-2 text-sm text-weave-light-accent dark:text-weave-dark-accent">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            <span>Parsing PDF...</span>
                          </div>
                        )}
                      </div>
                    )}
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
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary mb-2">
                  Temperature: {temperature}
                </label>
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
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
                <p className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                  Controls randomness in responses. Lower values give consistent, focused answers. Higher values create more creative, varied responses.
                </p>
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