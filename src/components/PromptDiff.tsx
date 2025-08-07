import React from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ChevronDown, ChevronUp } from 'lucide-react';

interface PromptDiffProps {
  originalPrompt: string;
  currentPrompt: string;
  showDiff: boolean;
  onToggleDiff: () => void;
  originalLabel?: string;
  currentLabel?: string;
}

export const PromptDiff: React.FC<PromptDiffProps> = ({
  originalPrompt,
  currentPrompt,
  showDiff,
  onToggleDiff,
  originalLabel = "Previous Prompt",
  currentLabel = "Current Prompt",
}) => {
  const hasChanges = originalPrompt !== currentPrompt;

  if (!hasChanges) {
    return null;
  }

  const highlightChanges = (text: string, isOriginal: boolean) => {
    if (!showDiff) return text;
    
    // Simple line-based diff highlighting
    const lines = text.split('\n');
    const originalLines = originalPrompt.split('\n');
    const currentLines = currentPrompt.split('\n');
    
    return lines.map((line, index) => {
      const otherLines = isOriginal ? currentLines : originalLines;
      const isChanged = otherLines[index] !== line;
      
      if (isChanged) {
        const bgColor = isOriginal ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20';
        const textColor = isOriginal ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300';
        return (
          <div key={index} className={`${bgColor} ${textColor} px-2 py-1 rounded mb-1`}>
            {line}
          </div>
        );
      }
      return <div key={index} className="mb-1">{line}</div>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-lg overflow-hidden"
    >
      <button
        onClick={onToggleDiff}
        className="w-full flex items-center justify-between p-4 hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
      >
        <div className="flex items-center space-x-2">
          <GitCompare className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
          <span className="font-medium text-weave-light-primary dark:text-weave-dark-primary">
            Prompt Changes
          </span>
        </div>
        {showDiff ? (
          <ChevronUp className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-weave-light-secondary dark:text-weave-dark-secondary" />
        )}
      </button>
      
      {showDiff && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-weave-light-border dark:border-weave-dark-border p-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>{originalLabel}</span>
              </h5>
              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded p-3 h-64 overflow-y-auto">
                <div className="text-xs font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap">
                  {highlightChanges(originalPrompt, true)}
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{currentLabel}</span>
              </h5>
              <div className="bg-weave-light-inputBg dark:bg-weave-dark-inputBg border border-weave-light-border dark:border-weave-dark-border rounded p-3 h-64 overflow-y-auto">
                <div className="text-xs font-mono text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap">
                  {highlightChanges(currentPrompt, false)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 