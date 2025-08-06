import React from 'react';
import { motion } from 'framer-motion';

interface ParameterControlsProps {
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onMaxTokensChange: (maxTokens: number) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

const AVAILABLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-pro',
];

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  showAdvanced,
  onToggleAdvanced,
}) => {
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

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {AVAILABLE_MODELS.map((modelName) => (
            <option key={modelName} value={modelName}>
              {modelName}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature Control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
            Creativity Level
          </label>
          <span className={`text-sm font-medium ${getTemperatureColor(temperature)}`}>
            {getTemperatureDescription(temperature)}
          </span>
        </div>
        <input
          id="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Focused)</span>
          <span>1 (Balanced)</span>
          <span>2 (Creative)</span>
        </div>
        
        {/* Temperature Explanation */}
        <div className="mt-2 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Temperature</strong> controls randomness in responses. Lower values (0-0.3) give consistent, focused answers. 
            Higher values (0.7-2.0) create more creative, varied responses. For most tasks, 0.7-1.0 works well.
          </p>
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          onClick={onToggleAdvanced}
          className="text-sm text-blue-600 hover:text-blue-800 transition-all duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] hover:scale-105 active:scale-95"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </motion.button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <div>
            <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-2">
              Max Response Length: {maxTokens} tokens
            </label>
            <input
              id="maxTokens"
              type="range"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100 (Short)</span>
              <span>2000 (Medium)</span>
              <span>4000 (Long)</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Controls maximum response length. Higher values allow longer, more detailed responses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 