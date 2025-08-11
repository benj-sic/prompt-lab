import React from 'react';
import { motion } from 'framer-motion';
import { Diff, ChevronUp, ChevronDown } from 'lucide-react';

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

  // Function to format prompt with bold component titles and proper spacing
  const formatPromptWithComponents = (prompt: string) => {
    const lines = prompt.split('\n');
    const formattedLines: React.ReactElement[] = [];
    
    lines.forEach((line, index) => {
      if (line.includes('[PDF STUDY REPORT:')) return;
      // Check if this line is a component title (ends with colon)
      if (line.trim().endsWith(':')) {
        // Add empty line before component (except for first component)
        if (index > 0 && lines[index - 1].trim() !== '') {
          formattedLines.push(<div key={`empty-${index}`} className="mb-4"></div>);
        }
        // Bold the component title
        formattedLines.push(
          <div key={index} className="font-bold text-weave-light-primary dark:text-weave-dark-primary mb-1">
            {line}
          </div>
        );
      } else {
        // Regular content line
        formattedLines.push(
          <div key={index} className="mb-1">
            {line}
          </div>
        );
      }
    });
    
    return formattedLines;
  };

  // Function to highlight changes using different colors instead of boxing
  const highlightChanges = (text: string, isOriginal: boolean) => {
    if (!showDiff) {
      return formatPromptWithComponents(text);
    }
    
    const lines = text.split('\n');
    const originalLines = originalPrompt.split('\n');
    const currentLines = currentPrompt.split('\n');
    const formattedLines: React.ReactElement[] = [];
    
    lines.forEach((line, index) => {
      if (line.includes('[PDF STUDY REPORT:')) return;
      const otherLines = isOriginal ? currentLines : originalLines;
      const isChanged = otherLines[index] !== line;
      
      // Check if this line is a component title
      const isComponentTitle = line.trim().endsWith(':');
      
      if (isChanged) {
        // Use different colors for changed lines instead of boxing
        const textColor = isOriginal 
          ? 'text-red-600 dark:text-red-400' 
          : 'text-green-600 dark:text-green-400';
        
        if (isComponentTitle) {
          // Add empty line before component (except for first component)
          if (index > 0 && lines[index - 1].trim() !== '') {
            formattedLines.push(<div key={`empty-${index}`} className="mb-4"></div>);
          }
          // Bold the component title with change color
          formattedLines.push(
            <div key={index} className={`font-bold ${textColor} mb-1`}>
              {line}
            </div>
          );
        } else {
          // Regular changed content line
          formattedLines.push(
            <div key={index} className={`${textColor} mb-1`}>
              {line}
            </div>
          );
        }
      } else {
        // Unchanged lines
        if (isComponentTitle) {
          // Add empty line before component (except for first component)
          if (index > 0 && lines[index - 1].trim() !== '') {
            formattedLines.push(<div key={`empty-${index}`} className="mb-4"></div>);
          }
          // Bold the component title
          formattedLines.push(
            <div key={index} className="font-bold text-weave-light-primary dark:text-weave-dark-primary mb-1">
              {line}
            </div>
          );
        } else {
          // Regular unchanged content line
          formattedLines.push(
            <div key={index} className="mb-1">
              {line}
            </div>
          );
        }
      }
    });
    
    return formattedLines;
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
          <Diff className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent" />
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
              
              <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap font-sans">
                {highlightChanges(originalPrompt, true)}
              </div>
            </div>
            <div>
              
              <div className="text-sm leading-relaxed text-weave-light-inputText dark:text-weave-dark-inputText whitespace-pre-wrap font-sans">
                {highlightChanges(currentPrompt, false)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 