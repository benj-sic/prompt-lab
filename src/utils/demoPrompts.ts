// Simple demo prompt that auto-fills a complete working example
export const DEMO_PROMPT = {
  task: 'Summarize the key findings from the attached GLP toxicity study for IND Module 2 in paragraph form.',
  persona: 'Regulatory writer',
  context: 'Refer to the attached PDF study report.',
  constraints: 'Use formal regulatory language. Keep under 200 words.',
  examples: '',
  format: '',
  instruction: ''
};

// Demo iterations are now handled through copy/paste from DEMO_EXAMPLES.md
// The hardcoded iterations have been removed to simplify the demo process

// Helper function to get demo prompt
export const getDemoPrompt = () => {
  return DEMO_PROMPT;
};

// Helper function to get demo iterations (now returns empty array)
export const getDemoIterations = () => {
  return [];
};