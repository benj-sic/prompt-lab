export interface ExperimentRun {
  id: string;
  timestamp: number;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  output: string;
  // Run-specific parameter tweaks
  parameterTweaks?: Record<string, any>;
  blockTweaks?: Record<string, string>; // Changes to specific blocks
  runNotes?: string;
  evaluation?: ExperimentEvaluation;
  // Branching fields
  parentRunId?: string; // ID of the run this was forked from
  branchName?: string; // User-defined branch name (e.g., "temperature-experiment", "context-variations")
  changeDescription?: string; // What changed from parent (e.g., "Increased temperature to 1.2")
}

export interface Experiment {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  hypothesis: string;
  objective?: string;
  runs: ExperimentRun[];
  notes: string;
  apiKey?: string;
  // Version tracking for prompt engineering
  version?: string; // v1, v2, v3...
  parentVersion?: string; // ID of the experiment this was based on
  changeMetadata?: ChangeMetadata;
  // New modular prompt building fields
  includedBlocks?: string[];
  blockContent?: Record<string, string>;
  changesFromPrevious?: BlockChanges;
  // Experiment analysis
  analysis?: ExperimentAnalysis;
}

export interface ExperimentAnalysis {
  runComparisons: RunComparison[];
  keyFindings: string[];
  recommendations: string[];
  timestamp: number;
}

export interface RunComparison {
  run1Id: string;
  run2Id: string;
  differences: string[];
  similarityScore: number;
  keyInsights: string[];
  notes?: string;
}

export interface BlockChanges {
  added: string[];
  removed: string[];
  modified: string[];
}

// Branching system types
export interface Branch {
  name: string;
  description?: string;
  rootRunId: string; // The run this branch starts from
  runs: string[]; // IDs of runs in this branch
  isActive?: boolean;
}

export interface ExperimentTree {
  experiment: Experiment;
  branches: Branch[];
  runTree: RunTreeNode[];
}

export interface RunTreeNode {
  run: ExperimentRun;
  children: RunTreeNode[];
  depth: number;
  branchColor?: string;
}

// New types for modular prompt building
export interface PromptBlock {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'advanced';
  defaultContent: string;
  placeholder: string;
  isRequired?: boolean;
}

export interface PromptBlockState {
  id: string;
  isIncluded: boolean;
  content: string;
  isCollapsed: boolean;
}

export interface PromptBuilderState {
  blocks: PromptBlockState[];
  assembledPrompt: string;
  previousExperiment?: Experiment;
}

export interface ChangeMetadata {
  whatChanged: string;
  whyChanged: string;
  didItImprove: 'yes' | 'no' | 'mixed' | 'unknown';
  keepThisVersion: boolean;
  timestamp: number;
}

export interface ExperimentEvaluation {
  rating: number; // 1-5 stars
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
  tags: string[];
  timestamp: number;
}

export interface ModelConfig {
  name: string;
  provider: 'gemini';
  maxTokens: number;
  temperature: number;
}

export interface ApiConfig {
  provider: 'gemini';
  apiKey?: string;
  baseUrl?: string;
}

export interface ExperimentLog {
  experiments: Experiment[];
  lastUpdated: number;
}

// Types for Lab Notebook entries
export interface LabNotebookEntry {
  id: string;
  title: string;
  content: string;
  category: 'hypothesis' | 'observation' | 'methodology' | 'failure-analysis' | 'insight' | 'takeaway' | 'future-direction';
  tags: string[];
  timestamp: number;
  starred: boolean;
  relatedExperiments?: string[]; // Array of experiment IDs
}

export interface LabNotebookLog {
  entries: LabNotebookEntry[];
  lastUpdated: number;
} 