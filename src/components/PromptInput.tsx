import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your prompt here..."
}) => {
  return (
    <div className="w-full">
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
        Prompt
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  );
}; 