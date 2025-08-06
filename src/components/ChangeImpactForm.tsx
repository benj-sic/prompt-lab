import React, { useState } from 'react';
import { ChangeMetadata } from '../types';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface ChangeImpactFormProps {
  onSubmit: (metadata: ChangeMetadata) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export const ChangeImpactForm: React.FC<ChangeImpactFormProps> = ({
  onSubmit,
  onCancel,
  isVisible,
}) => {
  const [formData, setFormData] = useState({
    whatChanged: '',
    whyChanged: '',
    didItImprove: 'unknown' as 'yes' | 'no' | 'mixed' | 'unknown',
    keepThisVersion: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: ChangeMetadata = {
      ...formData,
      timestamp: Date.now(),
    };
    onSubmit(metadata);
    // Reset form
    setFormData({
      whatChanged: '',
      whyChanged: '',
      didItImprove: 'unknown',
      keepThisVersion: true,
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Track Change Impact</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What changed in this version?
            </label>
            <textarea
              value={formData.whatChanged}
              onChange={(e) => setFormData({ ...formData, whatChanged: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Describe the specific changes made to the prompt..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Why was this change made?
            </label>
            <textarea
              value={formData.whyChanged}
              onChange={(e) => setFormData({ ...formData, whyChanged: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="What problem were you trying to solve?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did this change improve the output?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'yes', label: 'Yes', icon: TrendingUp, color: 'bg-green-100 text-green-800 border-green-300' },
                { value: 'no', label: 'No', icon: TrendingDown, color: 'bg-red-100 text-red-800 border-red-300' },
                { value: 'mixed', label: 'Mixed', icon: Minus, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                { value: 'unknown', label: 'Unknown', icon: HelpCircle, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, didItImprove: option.value as any })}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
                      formData.didItImprove === option.value
                        ? option.color
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="keepVersion"
              checked={formData.keepThisVersion}
              onChange={(e) => setFormData({ ...formData, keepThisVersion: e.target.checked })}
              className="h-4 w-4 text-weave-light-accent dark:text-weave-dark-accent focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent border-weave-light-border dark:border-weave-dark-border rounded"
            />
            <label htmlFor="keepVersion" className="text-sm text-gray-700">
              Keep this version as the new baseline?
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-weave-light-secondary dark:bg-weave-dark-secondary text-weave-light-primary dark:text-weave-dark-primary rounded-lg hover:bg-weave-light-border dark:hover:bg-weave-dark-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 