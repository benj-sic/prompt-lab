import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Brain, Copy, Check, Save } from 'lucide-react';
import { Experiment, ExperimentRun, RunComparison as RunComparisonType } from '../types';
import { ApiService } from '../services/api';

interface RunComparisonProps {
  experiment: Experiment;
  run1: ExperimentRun;
  run2: ExperimentRun;
  onSaveAnalysis: (analysis: RunComparisonType) => void;
  apiKey?: string;
}

export const RunComparison: React.FC<RunComparisonProps> = ({
  experiment,
  run1,
  run2,
  onSaveAnalysis,
  apiKey,
}) => {
  const [analysis, setAnalysis] = useState<RunComparisonType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiService = new ApiService({
    provider: 'gemini',
    apiKey: apiKey || undefined,
  });

  const analyzeDifferences = async () => {
    if (!run1.output || !run2.output) return;

    setIsAnalyzing(true);
    try {
      const analysisPrompt = `You are an expert prompt engineering analyst. Compare these two AI outputs and identify the key differences.

**Run 1 Parameters:**
${Object.entries(run1.parameterTweaks || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}
${Object.entries(run1.blockTweaks || {}).map(([k, v]) => `Block ${k}: ${v}`).join('\n')}

**Run 1 Output:**
${run1.output}

**Run 2 Parameters:**
${Object.entries(run2.parameterTweaks || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}
${Object.entries(run2.blockTweaks || {}).map(([k, v]) => `Block ${k}: ${v}`).join('\n')}

**Run 2 Output:**
${run2.output}

Please analyze the differences and provide:

1. **Key Differences** (bullet points of specific differences)
2. **Similarity Score** (0-100, where 100 is identical)
3. **Key Insights** (what these differences tell us about the parameter changes)

Format your response as:
**Key Differences:**
- [difference 1]
- [difference 2]

**Similarity Score:** [0-100]

**Key Insights:**
- [insight 1]
- [insight 2]`;

      const result = await apiService.runExperiment(analysisPrompt, 'gemini-1.5-flash', 0.3, 1000);
      
      // Parse the analysis result
      const lines = result.split('\n');
      const differences: string[] = [];
      const insights: string[] = [];
      let similarityScore = 50; // default
      let currentSection = '';

      for (const line of lines) {
        if (line.includes('**Key Differences:**')) {
          currentSection = 'differences';
        } else if (line.includes('**Similarity Score:**')) {
          currentSection = 'score';
          const scoreMatch = line.match(/(\d+)/);
          if (scoreMatch) similarityScore = parseInt(scoreMatch[1]);
        } else if (line.includes('**Key Insights:**')) {
          currentSection = 'insights';
        } else if (line.startsWith('- ') && currentSection === 'differences') {
          differences.push(line.substring(2));
        } else if (line.startsWith('- ') && currentSection === 'insights') {
          insights.push(line.substring(2));
        }
      }

      const newAnalysis: RunComparisonType = {
        run1Id: run1.id,
        run2Id: run2.id,
        differences,
        similarityScore,
        keyInsights: insights,
      };

      setAnalysis(newAnalysis);
    } catch (error) {
      console.error('Failed to analyze differences:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getTweakSummary = (run: ExperimentRun) => {
    const tweaks: string[] = [];
    
    if (run.parameterTweaks) {
      Object.entries(run.parameterTweaks).forEach(([param, value]) => {
        tweaks.push(`${param}: ${value}`);
      });
    }
    
    if (run.blockTweaks) {
      Object.entries(run.blockTweaks).forEach(([block, tweak]) => {
        tweaks.push(`${block}: ${tweak}`);
      });
    }
    
    return tweaks.length > 0 ? tweaks.join(', ') : 'No tweaks';
  };

  useEffect(() => {
    if (run1.output && run2.output && !analysis) {
      analyzeDifferences();
    }
  }, [run1.output, run2.output]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Run Comparison</h3>
        <div className="flex items-center space-x-2">
          {analysis && (
            <button
              onClick={() => onSaveAnalysis(analysis)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Analysis</span>
            </button>
          )}
          <button
            onClick={analyzeDifferences}
            disabled={isAnalyzing || !run1.output || !run2.output}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-weave-light-accent dark:bg-weave-dark-accent text-white rounded-lg hover:bg-weave-light-accentMuted dark:hover:bg-weave-dark-accentMuted transition-colors disabled:bg-weave-light-secondary"
          >
            <Brain className="h-4 w-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>
        </div>
      </div>

      {/* Run Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Run 1 */}
        <div className="p-4 border border-gray-200 rounded-md bg-white">
          <h4 className="font-medium text-gray-900 mb-2">Run 1</h4>
          <div className="text-sm text-gray-600 mb-2">
            <strong>Tweaks:</strong> {getTweakSummary(run1)}
          </div>
          {run1.runNotes && (
            <div className="text-xs text-gray-500 mb-2 italic">
              {run1.runNotes}
            </div>
          )}
          <div className="text-sm text-gray-800 max-h-40 overflow-y-auto">
            {run1.output || 'No output yet'}
          </div>
        </div>

        {/* Run 2 */}
        <div className="p-4 border border-gray-200 rounded-md bg-white">
          <h4 className="font-medium text-gray-900 mb-2">Run 2</h4>
          <div className="text-sm text-gray-600 mb-2">
            <strong>Tweaks:</strong> {getTweakSummary(run2)}
          </div>
          {run2.runNotes && (
            <div className="text-xs text-gray-500 mb-2 italic">
              {run2.runNotes}
            </div>
          )}
          <div className="text-sm text-gray-800 max-h-40 overflow-y-auto">
            {run2.output || 'No output yet'}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Similarity Score */}
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Similarity Score</h4>
              <div className="flex items-center space-x-2">
                {analysis.similarityScore > 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : analysis.similarityScore < 30 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-lg font-bold text-gray-900">
                  {analysis.similarityScore}/100
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysis.similarityScore}%` }}
              ></div>
            </div>
          </div>

          {/* Key Differences */}
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <h4 className="font-medium text-gray-900 mb-2">Key Differences</h4>
            <div className="space-y-1">
              {analysis.differences.map((difference, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-sm text-gray-700">{difference}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
            <div className="space-y-1">
              {analysis.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sm text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy Analysis */}
          <div className="flex justify-end">
            <button
              onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>Copy Analysis</span>
            </button>
          </div>
        </motion.div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing differences...</p>
        </div>
      )}

      {!run1.output || !run2.output ? (
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Both runs need to be completed before comparison</p>
        </div>
      ) : null}
    </div>
  );
}; 