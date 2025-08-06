import React, { useState } from 'react';
import { Copy, Check, BookOpen, Plus } from 'lucide-react';
import { LabNotebookEntry } from '../types';
import { StorageService } from '../services/storage';

interface OutputDisplayProps {
  output: string;
  isLoading: boolean;
  error?: string;
  currentPrompt?: string;
  currentNotes?: string;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({
  output,
  isLoading,
  error,
  currentPrompt,
  currentNotes,
}) => {
  const [copied, setCopied] = useState(false);
  const [showLabNotebookForm, setShowLabNotebookForm] = useState(false);
  const [labNotebookEntry, setLabNotebookEntry] = useState({
    title: '',
    content: '',
    category: 'insight' as const,
    tags: '',
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleAddToLabNotebook = () => {
    if (labNotebookEntry.title && labNotebookEntry.content) {
      const entry: LabNotebookEntry = {
        id: Date.now().toString(),
        title: labNotebookEntry.title,
        content: labNotebookEntry.content,
        category: labNotebookEntry.category,
        tags: labNotebookEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        timestamp: Date.now(),
        starred: false,
      };
      StorageService.saveLabNotebookEntry(entry);
      setLabNotebookEntry({ title: '', content: '', category: 'insight', tags: '' });
      setShowLabNotebookForm(false);
    }
  };

  const quickAddToLabNotebook = (category: LabNotebookEntry['category']) => {
    const title = `Experiment Insight - ${new Date().toLocaleDateString()}`;
    const content = `**Prompt:**\n${currentPrompt || 'N/A'}\n\n**Notes:**\n${currentNotes || 'N/A'}\n\n**Output:**\n${output}\n\n**Insight:** [Add your insight here]`;
    
    const entry: LabNotebookEntry = {
      id: Date.now().toString(),
      title,
      content,
      category,
      tags: ['experiment-insight', 'modular'],
      timestamp: Date.now(),
      starred: false,
    };
    StorageService.saveLabNotebookEntry(entry);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Output
          </label>
        </div>
        <div className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-gray-500">Generating response...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Error
          </label>
        </div>
        <div className="w-full h-64 px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-700 overflow-auto">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Output
        </label>
        {output && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLabNotebookForm(!showLabNotebookForm)}
              className="flex items-center space-x-1 text-sm text-weave-light-accent dark:text-weave-dark-accent hover:text-weave-light-accentMuted dark:hover:text-weave-dark-accentMuted transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Add to Lab Notebook</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Quick Add to Lab Notebook Buttons */}
      {output && showLabNotebookForm && (
        <div className="mb-4 p-3 border border-blue-200 rounded-md bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Quick Add to Lab Notebook</h4>
            <button
              onClick={() => setShowLabNotebookForm(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { category: 'hypothesis' as const, label: 'Hypothesis', color: 'bg-purple-100 text-purple-800' },
              { category: 'observation' as const, label: 'Observation', color: 'bg-blue-100 text-blue-800' },
              { category: 'methodology' as const, label: 'Methodology', color: 'bg-green-100 text-green-800' },
              { category: 'failure-analysis' as const, label: 'Failure Analysis', color: 'bg-red-100 text-red-800' },
            ].map((option) => (
              <button
                key={option.category}
                onClick={() => quickAddToLabNotebook(option.category)}
                className={`p-2 text-xs rounded-md border transition-colors ${option.color} hover:opacity-80`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 overflow-auto whitespace-pre-wrap">
        {output || 'No output yet. Run an experiment to see results here.'}
      </div>
    </div>
  );
}; 