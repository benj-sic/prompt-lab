import React from 'react';
import { Experiment } from '../types';
import { Trash2, Download, Upload, GitBranch, TrendingUp, TrendingDown, Minus, HelpCircle, Plus, X } from 'lucide-react';

interface ExperimentHistoryProps {
  experiments: Experiment[];
  onDelete: (id: string) => void;
  onSelect: (experiment: Experiment) => void;
  onExport: () => void;
  onImport: (data: string) => void;
}

export const ExperimentHistory: React.FC<ExperimentHistoryProps> = ({
  experiments,
  onDelete,
  onSelect,
  onExport,
  onImport,
}) => {
  const [showImport, setShowImport] = React.useState(false);
  const [importData, setImportData] = React.useState('');

  const handleImport = () => {
    if (importData.trim()) {
      onImport(importData);
      setImportData('');
      setShowImport(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getImprovementIcon = (improvement: string) => {
    switch (improvement) {
      case 'yes':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'no':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'mixed':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImprovementText = (improvement: string) => {
    switch (improvement) {
      case 'yes':
        return 'Improved';
      case 'no':
        return 'Worse';
      case 'mixed':
        return 'Mixed';
      default:
        return 'Unknown';
    }
  };

  const renderBlockChanges = (experiment: Experiment) => {
    if (!experiment.changesFromPrevious) return null;

    const { added, removed, modified } = experiment.changesFromPrevious;

    return (
      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
        <div className="text-xs font-medium text-green-800 mb-1">Block Changes:</div>
        <div className="space-y-1">
          {added.length > 0 && (
            <div className="flex items-center space-x-1">
              <Plus className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-700">Added: {added.join(', ')}</span>
            </div>
          )}
          {removed.length > 0 && (
            <div className="flex items-center space-x-1">
              <X className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-700">Removed: {removed.join(', ')}</span>
            </div>
          )}
          {modified.length > 0 && (
            <div className="flex items-center space-x-1">
              <Minus className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-700">Modified: {modified.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Experiment History</h3>
        <div className="flex space-x-2">
          <button
            onClick={onExport}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {showImport && (
        <div className="mb-4 p-4 border border-gray-300 rounded-md bg-gray-50">
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON data here..."
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleImport}
              className="px-3 py-1 text-sm bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted"
            >
              Import
            </button>
            <button
              onClick={() => {
                setImportData('');
                setShowImport(false);
              }}
              className="px-3 py-1 text-sm bg-weave-light-secondary dark:bg-weave-dark-secondary text-weave-light-primary dark:text-weave-dark-primary rounded-lg hover:bg-weave-light-border dark:hover:bg-weave-dark-border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {experiments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No experiments yet. Run your first experiment to see it here!</p>
        ) : (
          experiments.map((experiment) => (
            <div
              key={experiment.id}
              className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelect(experiment)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {experiment.runs && experiment.runs.length > 0 ? experiment.runs[0]?.model || 'Unknown Model' : 'No Runs'}
                    </span>
                    {experiment.version && (
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">
                          {experiment.version}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(experiment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    {truncateText(experiment.title)}
                  </p>
                  {experiment.notes && (
                    <p className="text-xs text-gray-500 italic">
                      Note: {truncateText(experiment.notes, 50)}
                    </p>
                  )}
                  {experiment.includedBlocks && experiment.includedBlocks.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Blocks: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {experiment.includedBlocks.map((blockId) => (
                          <span
                            key={blockId}
                            className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded"
                          >
                            {blockId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {experiment.changeMetadata && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center space-x-2 mb-1">
                        {getImprovementIcon(experiment.changeMetadata.didItImprove)}
                        <span className="text-xs font-medium text-blue-800">
                          {getImprovementText(experiment.changeMetadata.didItImprove)}
                        </span>
                        {experiment.changeMetadata.keepThisVersion && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                            Baseline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-700">
                        {truncateText(experiment.changeMetadata.whatChanged, 80)}
                      </p>
                    </div>
                  )}
                  {renderBlockChanges(experiment)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(experiment.id);
                  }}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete experiment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 