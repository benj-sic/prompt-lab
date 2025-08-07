import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

interface IterationParameterControlsProps {
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onMaxTokensChange: (maxTokens: number) => void;
  changedParameter: string | null;
  onParameterChange: (parameter: string) => void;
  onResetParameter: (parameter: string) => void;
  changedBlock: string | null;
  lastRunParameters: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  currentRunNumber?: number;
  previousRunNumber?: number;
}



export const IterationParameterControls: React.FC<IterationParameterControlsProps> = ({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  changedParameter,
  onParameterChange,
  onResetParameter,
  changedBlock,
  lastRunParameters,
  currentRunNumber,
  previousRunNumber,
}) => {
  const [showParameters, setShowParameters] = useState(false);
  const getTemperatureDescription = (temp: number) => {
    if (temp <= 0.3) return 'Focused (Consistent)';
    if (temp <= 0.7) return 'Balanced (Creative)';
    if (temp <= 1.0) return 'Creative (Varied)';
    return 'Very Creative (Unpredictable)';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 0.3) return 'text-green-600';
    if (temp <= 0.7) return 'text-blue-600';
    if (temp <= 1.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleParameterChange = (parameter: string, value: any) => {
    // Only allow changing one parameter at a time
    if (changedParameter && changedParameter !== parameter) {
      return;
    }
    
    onParameterChange(parameter);
    
    switch (parameter) {
      case 'model':
        onModelChange(value);
        break;
      case 'temperature':
        onTemperatureChange(value);
        break;
      case 'maxTokens':
        onMaxTokensChange(value);
        break;
    }
  };

  const isParameterDisabled = (parameter: string) => {
    return (changedParameter !== null && changedParameter !== parameter) || changedBlock !== null;
  };

  const getParameterChangeIndicator = (parameter: string, currentValue: any, lastValue: any) => {
    if (currentValue !== lastValue) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Changed
        </span>
      );
    }
    return null;
  };

  const hasAnyChanges = model !== lastRunParameters.model || 
                    temperature !== lastRunParameters.temperature || 
                    maxTokens !== lastRunParameters.maxTokens;

  const resetAllParameters = () => {
    onResetParameter('model');
    onResetParameter('temperature');
    onResetParameter('maxTokens');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowParameters(!showParameters)}
          className="flex items-center space-x-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
        >
          {showParameters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>Model Parameters</span>
          <span className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary">
            (Model: {model}, Temperature: {temperature}, Tokens: {maxTokens})
          </span>
          {changedParameter && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              {changedParameter} Changed
            </span>
          )}
        </button>
        
        {/* Reset All Button - Show for run 3 and beyond */}
        {(currentRunNumber || 0) >= 3 && hasAnyChanges && (
          <button
            onClick={resetAllParameters}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>
    
      <AnimatePresence>
        {showParameters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 border border-weave-light-border dark:border-weave-dark-border rounded-lg bg-weave-light-surface dark:bg-weave-dark-surface"
          >


            {/* Model Selection */}
            <div className={`${
              changedParameter === 'model' 
                ? 'ring-2 ring-weave-light-accent dark:ring-weave-dark-accent bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted p-3 rounded-lg' 
                : isParameterDisabled('model')
                ? 'opacity-50'
                : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary">
                  Model
                </label>
                <div className="flex items-center space-x-2">
                  {getParameterChangeIndicator('model', model, lastRunParameters.model)}
                  {model !== lastRunParameters.model && (
                    <button
                      onClick={() => onResetParameter('model')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <select
                value={model}
                onChange={(e) => handleParameterChange('model', e.target.value)}
                disabled={isParameterDisabled('model')}
                className={`w-full px-3 py-2 border border-weave-light-border dark:border-weave-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-weave-light-secondary dark:focus:ring-weave-dark-secondary bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText ${
                  isParameterDisabled('model') ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
              <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                <span>Run {previousRunNumber || 'Previous'}: {lastRunParameters.model}</span>
                <span>Run {currentRunNumber || 'Current'}: {model}</span>
              </div>
            </div>

            {/* Temperature Control */}
            <div className={`${
              changedParameter === 'temperature' 
                ? 'ring-2 ring-weave-light-accent dark:ring-weave-dark-accent bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted p-3 rounded-lg' 
                : isParameterDisabled('temperature')
                ? 'opacity-50'
                : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary">
                  Creativity Level
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getTemperatureColor(temperature)}`}>
                    {getTemperatureDescription(temperature)}
                  </span>
                  {getParameterChangeIndicator('temperature', temperature, lastRunParameters.temperature)}
                  {temperature !== lastRunParameters.temperature && (
                    <button
                      onClick={() => onResetParameter('temperature')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                disabled={isParameterDisabled('temperature')}
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
                  isParameterDisabled('temperature') ? 'opacity-50 cursor-not-allowed' : ''
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
              
              <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-2">
                <span>Run {previousRunNumber || 'Previous'}: {lastRunParameters.temperature}</span>
                <span>Run {currentRunNumber || 'Current'}: {temperature}</span>
              </div>
            </div>

            {/* Max Tokens Control */}
            <div className={`${
              changedParameter === 'maxTokens' 
                ? 'ring-2 ring-weave-light-accent dark:ring-weave-dark-accent bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted p-3 rounded-lg' 
                : isParameterDisabled('maxTokens')
                ? 'opacity-50'
                : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-weave-light-secondary dark:text-weave-dark-secondary">
                  Max Response Length: {maxTokens} tokens
                </label>
                <div className="flex items-center space-x-2">
                  {getParameterChangeIndicator('maxTokens', maxTokens, lastRunParameters.maxTokens)}
                  {maxTokens !== lastRunParameters.maxTokens && (
                    <button
                      onClick={() => onResetParameter('maxTokens')}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                disabled={isParameterDisabled('maxTokens')}
                className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
                  isParameterDisabled('maxTokens') ? 'opacity-50 cursor-not-allowed' : ''
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
              <div className="flex justify-between text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-2">
                <span>Run {previousRunNumber || 'Previous'}: {lastRunParameters.maxTokens}</span>
                <span>Run {currentRunNumber || 'Current'}: {maxTokens}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 