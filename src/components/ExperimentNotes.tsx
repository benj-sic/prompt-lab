import React from 'react';

interface ExperimentNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export const ExperimentNotes: React.FC<ExperimentNotesProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="w-full">
      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
        Experiment Context & Notes
      </label>
      <textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are you trying to achieve? What's the context? Any specific requirements or constraints? This helps track the intention behind your prompt..."
        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      />
      <p className="text-xs text-gray-500 mt-1">
        Document your goal, context, or any specific requirements for this prompt experiment.
      </p>
    </div>
  );
}; 