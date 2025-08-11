import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

  // Removed getParameterChangeIndicator function - no longer needed



  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowParameters(!showParameters)}
          className="flex items-center space-x-2 text-weave-light-secondary dark:text-weave-dark-secondary hover:text-weave-light-primary dark:hover:text-weave-dark-primary transition-colors"
        >
          {showParameters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>Model Parameters</span>


        </button>
        
        {/* Individual reset buttons are shown for each changed parameter above */}
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
                  Temperature: {temperature}
                </label>
                <div className="flex items-center space-x-2">
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
                <span>0</span>
                <span>1</span>
                <span>2</span>
              </div>
              <p className="text-xs text-weave-light-secondary dark:text-weave-dark-secondary mt-1">
                Controls randomness in responses. Lower values give consistent, focused answers. Higher values create more creative, varied responses.
              </p>
              

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

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 