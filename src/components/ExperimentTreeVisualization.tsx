import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Eye } from 'lucide-react';
import { Experiment, ExperimentRun, RunTreeNode } from '../types';

interface ExperimentTreeVisualizationProps {
  experiment: Experiment;
  onRunSelect?: (run: ExperimentRun) => void;
  onForkFromRun?: (run: ExperimentRun) => void;
  selectedRunId?: string;
}

export const ExperimentTreeVisualization: React.FC<ExperimentTreeVisualizationProps> = ({
  experiment,
  onRunSelect,
  onForkFromRun,
  selectedRunId,
}) => {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(['main']));

  const getBranchColor = useCallback((branchName: string) => {
    const colors = {
      main: '#3b82f6',      // blue
      temperature: '#f59e0b', // amber
      context: '#8b5cf6',     // violet  
      model: '#10b981',       // emerald
      examples: '#f97316',    // orange
      constraints: '#ec4899', // pink
    };
    
    // Hash branch name to get consistent color
    if (colors[branchName as keyof typeof colors]) {
      return colors[branchName as keyof typeof colors];
    }
    
    const hash = branchName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colorOptions = Object.values(colors);
    return colorOptions[Math.abs(hash) % colorOptions.length];
  }, []);

  // Build the tree structure from runs
  const treeData = useMemo(() => {
    const runs = experiment.runs || [];

    const nodeMap = new Map<string, RunTreeNode>();
    
    // Create nodes for all runs
    runs.forEach(run => {
      nodeMap.set(run.id, {
        run,
        children: [],
        depth: 0,
        branchColor: getBranchColor(run.branchName || 'main'),
      });
    });

    // Build parent-child relationships
    runs.forEach(run => {
      if (run.parentRunId && nodeMap.has(run.parentRunId)) {
        const parentNode = nodeMap.get(run.parentRunId)!;
        const childNode = nodeMap.get(run.id)!;
        childNode.depth = parentNode.depth + 1;
        parentNode.children.push(childNode);
      }
    });

    // Find root nodes (no parent)
    const rootNodes = Array.from(nodeMap.values()).filter(node => !node.run.parentRunId);
    
    return rootNodes;
  }, [experiment.runs, getBranchColor]);

  // Extract unique branches
  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    experiment.runs?.forEach(run => {
      branchSet.add(run.branchName || 'main');
    });
    return Array.from(branchSet).map(name => ({
      name,
      description: name === 'main' ? 'Main experiment line' : `${name} branch`,
      color: getBranchColor(name),
    }));
  }, [experiment.runs, getBranchColor]);

  const toggleBranch = (branchName: string) => {
    setExpandedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchName)) {
        newSet.delete(branchName);
      } else {
        newSet.add(branchName);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node: RunTreeNode, isLast: boolean = false) => {
    const isSelected = selectedRunId === node.run.id;
    const branchName = node.run.branchName || 'main';
    const isBranchExpanded = expandedBranches.has(branchName);
    
    if (!isBranchExpanded && node.depth > 0) {
      return null;
    }

    return (
      <motion.div
        key={node.run.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        {/* Connection lines */}
        {node.depth > 0 && (
          <>
            {/* Vertical line from parent */}
            <div 
              className="absolute left-4 top-0 w-0.5 h-4"
              style={{ backgroundColor: node.branchColor }}
            />
            {/* Horizontal line to node */}
            <div 
              className="absolute left-4 top-4 w-4 h-0.5"
              style={{ backgroundColor: node.branchColor }}
            />
            {/* Vertical line continuing down (if not last child) */}
            {!isLast && (
              <div 
                className="absolute left-4 top-4 w-0.5"
                style={{ 
                  backgroundColor: node.branchColor,
                  height: 'calc(100% - 16px)'
                }}
              />
            )}
          </>
        )}

        {/* Run node */}
        <div 
          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ml-${node.depth * 8} ${
            isSelected 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => onRunSelect?.(node.run)}
        >
          {/* Branch indicator */}
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.branchColor }}
          />
          
          {/* Run info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Run {getRunNumber(node.run)}
              </span>
              {node.run.branchName && node.run.branchName !== 'main' && (
                <span 
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: node.branchColor }}
                >
                  {node.run.branchName}
                </span>
              )}
            </div>
            {node.run.changeDescription && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {node.run.changeDescription}
              </p>
            )}
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{node.run.model}</span>
              <span>T: {node.run.temperature}</span>
              <span>{node.run.maxTokens} tokens</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {node.run.output && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSelect?.(node.run);
                }}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="View run"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onForkFromRun?.(node.run);
              }}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Fork from this run"
            >
              <GitBranch className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Render children */}
        {node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child, index) => 
              renderTreeNode(child, index === node.children.length - 1)
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const getRunNumber = (run: ExperimentRun) => {
    const runIndex = experiment.runs?.findIndex(r => r.id === run.id) ?? -1;
    return runIndex + 1;
  };

  return (
    <div className="space-y-4">
      {/* Branch legend */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
          <GitBranch className="h-4 w-4" />
          <span>Experiment Branches</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {branches.map(branch => (
            <button
              key={branch.name}
              onClick={() => toggleBranch(branch.name)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                expandedBranches.has(branch.name)
                  ? 'border-gray-400 bg-white dark:bg-gray-700'
                  : 'border-gray-200 bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: branch.color }}
              />
              <span className="text-sm">{branch.name}</span>
              <span className="text-xs text-gray-500">
                ({experiment.runs?.filter(r => (r.branchName || 'main') === branch.name).length || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tree visualization */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-2">
          {treeData.map((rootNode, index) => 
            renderTreeNode(rootNode, index === treeData.length - 1)
          )}
        </div>
        
        {treeData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No runs yet. Start by creating your first run.</p>
          </div>
        )}
      </div>
    </div>
  );
};