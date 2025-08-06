// Simple demo prompt that auto-fills a complete working example
export const DEMO_PROMPT = {
  task: 'Summarize the adverse events observed in this mock TLF dataset.',
  persona: 'You are a regulatory writer preparing a draft for FDA review. You have 15+ years of experience in clinical documentation and understand the importance of precise, compliant language.',
  context: 'The data reflects a 12-week Phase 2 study in 84 patients with moderate to severe symptoms. Mock TLF data shows 23 patients reported adverse events, with headache (12 cases), nausea (8 cases), and fatigue (6 cases) being most common.',
  constraints: 'Use a neutral tone. Limit to 150 words. Use regulatory-compliant language.'
};

// Helper function to get demo prompt
export const getDemoPrompt = () => {
  return DEMO_PROMPT;
};