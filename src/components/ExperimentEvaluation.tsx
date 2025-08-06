import React, { useState } from 'react';
import { Star, Tag, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ExperimentEvaluation as Evaluation } from '../types';

interface ExperimentEvaluationProps {
  experimentId: string;
  output: string;
  onSaveEvaluation: (evaluation: Evaluation) => void;
  existingEvaluation?: Evaluation;
}

const QUALITY_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'good', label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'fair', label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'poor', label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' },
] as const;

const COMMON_TAGS = [
  'accurate', 'helpful', 'creative', 'detailed', 'concise', 
  'relevant', 'insightful', 'well-structured', 'original', 'practical'
];

export const ExperimentEvaluation: React.FC<ExperimentEvaluationProps> = ({
  experimentId,
  output,
  onSaveEvaluation,
  existingEvaluation,
}) => {
  const [rating, setRating] = useState(existingEvaluation?.rating || 0);
  const [quality, setQuality] = useState<Evaluation['quality']>(existingEvaluation?.quality || 'good');
  const [feedback, setFeedback] = useState(existingEvaluation?.feedback || '');
  const [tags, setTags] = useState<string[]>(existingEvaluation?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    const evaluation: Evaluation = {
      rating,
      quality,
      feedback,
      tags,
      timestamp: Date.now(),
    };
    onSaveEvaluation(evaluation);
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Evaluate Response</h3>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-1 transition-colors ${
                star <= rating 
                  ? 'text-yellow-500' 
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Star className={`h-6 w-6 ${star <= rating ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {rating === 0 && 'Click to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>
      </div>

      {/* Quality Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quality Assessment
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setQuality(option.value)}
              className={`p-2 rounded-md border transition-colors ${
                quality === option.value
                  ? `${option.bgColor} ${option.color} border-current`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="space-y-3">
          {/* Common Tags */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Common tags:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    tags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Add custom tag:</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter custom tag..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Tags */}
          {tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What worked well? What could be improved? Any specific observations..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={rating === 0}
          className="px-4 py-2 bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted disabled:bg-weave-light-secondary disabled:cursor-not-allowed transition-colors"
        >
          Save Evaluation
        </button>
      </div>
    </div>
  );
}; 