import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';

interface ApiErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  onRetry,
  isLoading = false,
}) => {
  const isOverloaded = error.includes('503') || error.includes('overloaded');
  const isRateLimited = error.includes('429') || error.includes('rate limit');
  const isAuthError = error.includes('401') || error.includes('403') || error.includes('API key');
  const isModelNotFound = error.includes('404') || error.includes('not found') || error.includes('not supported');

  const getErrorType = () => {
    if (isOverloaded) return 'overloaded';
    if (isRateLimited) return 'rate-limited';
    if (isAuthError) return 'auth-error';
    if (isModelNotFound) return 'model-not-found';
    return 'general';
  };

  const getErrorMessage = () => {
    if (isOverloaded) {
      return 'The AI model is currently overloaded. This is a temporary issue that should resolve itself shortly.';
    }
    if (isRateLimited) {
      return 'You\'ve hit the rate limit. Please wait a moment before trying again.';
    }
    if (isModelNotFound) {
      return 'The requested model is not available in your region or API version. The system will automatically try alternative models.';
    }
    if (isAuthError) {
      return 'There\'s an issue with your API key. Please check your configuration.';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const getSuggestions = () => {
    if (isOverloaded) {
      return [
        'Wait a few minutes and try again',
        'Try using a different model (gemini-1.5-pro instead of gemini-1.5-flash)',
        'The system will automatically retry with fallback models'
      ];
    }
    if (isRateLimited) {
      return [
        'Wait a few minutes before trying again',
        'Reduce the frequency of your requests'
      ];
    }
    if (isModelNotFound) {
      return [
        'The system will automatically try alternative models',
        'Try using gemini-1.5-flash instead',
        'Check if the model is available in your region'
      ];
    }
    if (isAuthError) {
      return [
        'Check that your API key is correct',
        'Make sure your API key has the necessary permissions',
        'Verify your API key is active in the Google AI Studio'
      ];
    }
    return [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ];
  };

  const errorType = getErrorType();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${
        errorType === 'overloaded' 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : errorType === 'rate-limited'
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          : errorType === 'model-not-found'
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : errorType === 'auth-error'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${
          errorType === 'overloaded' 
            ? 'text-yellow-600 dark:text-yellow-400'
            : errorType === 'rate-limited'
            ? 'text-orange-600 dark:text-orange-400'
            : errorType === 'model-not-found'
            ? 'text-blue-600 dark:text-blue-400'
            : errorType === 'auth-error'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {errorType === 'overloaded' ? (
            <Info className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${
            errorType === 'overloaded' 
              ? 'text-yellow-800 dark:text-yellow-200'
              : errorType === 'rate-limited'
              ? 'text-orange-800 dark:text-orange-200'
              : errorType === 'model-not-found'
              ? 'text-blue-800 dark:text-blue-200'
              : errorType === 'auth-error'
              ? 'text-red-800 dark:text-red-200'
              : 'text-gray-800 dark:text-gray-200'
          }`}>
                      {errorType === 'overloaded' ? 'Model Temporarily Overloaded' :
           errorType === 'rate-limited' ? 'Rate Limit Exceeded' :
           errorType === 'model-not-found' ? 'Model Not Available' :
           errorType === 'auth-error' ? 'Authentication Error' :
           'API Error'}
          </h4>
          
          <p className={`mt-1 text-sm ${
            errorType === 'overloaded' 
              ? 'text-yellow-700 dark:text-yellow-300'
              : errorType === 'rate-limited'
              ? 'text-orange-700 dark:text-orange-300'
              : errorType === 'model-not-found'
              ? 'text-blue-700 dark:text-blue-300'
              : errorType === 'auth-error'
              ? 'text-red-700 dark:text-red-300'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {getErrorMessage()}
          </p>
          
          <div className="mt-3">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Suggestions:
            </h5>
            <ul className="space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                disabled={isLoading}
                className={`inline-flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Retrying...' : 'Try Again'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 