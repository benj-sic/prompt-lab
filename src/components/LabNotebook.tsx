import React, { useState } from 'react';
import { BookOpen, GitBranch, TrendingUp, TrendingDown, Minus, HelpCircle, X, Plus, Trash2, Download, Upload, Calendar, Target, Lightbulb } from 'lucide-react';
import { Experiment } from '../types';

interface LabNotebookProps {
  experiments: Experiment[];
  onSelectExperiment: (experiment: Experiment) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (data: string) => void;
}

export const LabNotebook: React.FC<LabNotebookProps> = ({
  experiments,
  onSelectExperiment,
  onDelete,
  onExport,
  onImport,
}) => {
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleImport = () => {
    if (importData.trim()) {
      onImport(importData);
      setImportData('');
      setShowImport(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
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
      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
        <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Changes:</div>
        <div className="space-y-1">
          {added.length > 0 && (
            <div className="flex items-center space-x-1">
              <Plus className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-300">Added: {added.join(', ')}</span>
            </div>
          )}
          {removed.length > 0 && (
            <div className="flex items-center space-x-1">
              <X className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-700 dark:text-red-300">Removed: {removed.join(', ')}</span>
            </div>
          )}
          {modified.length > 0 && (
            <div className="flex items-center space-x-1">
              <Minus className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">Modified: {modified.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredExperiments = experiments.filter(experiment => 
    experiment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    experiment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    experiment.hypothesis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-weave-light-accent dark:text-weave-dark-accent" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Notebook</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExport}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Import Form */}
      {showImport && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Data</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON data here..."
            className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleImport}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Import
            </button>
            <button
              onClick={() => {
                setImportData('');
                setShowImport(false);
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              onClick={() => onSelectExperiment(experiment)}
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

                  {/* Description */}
                  {experiment.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {truncateText(experiment.description, 150)}
                    </p>
                  )}

                  {/* Hypothesis */}
                  {experiment.hypothesis && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center space-x-1 mb-1">
                        <Lightbulb className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Hypothesis</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {truncateText(experiment.hypothesis, 120)}
                      </p>
                    </div>
                  )}

                  {/* Block Changes */}
                  {renderBlockChanges(experiment)}

                  {/* Improvement Status */}
                  {experiment.changeMetadata && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center space-x-2 mb-1">
                        {getImprovementIcon(experiment.changeMetadata.didItImprove)}
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                          {getImprovementText(experiment.changeMetadata.didItImprove)}
                        </span>
                        {experiment.changeMetadata.keepThisVersion && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 rounded">
                            Baseline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {truncateText(experiment.changeMetadata.whatChanged, 80)}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {experiment.notes && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                        Note: {truncateText(experiment.notes, 100)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
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