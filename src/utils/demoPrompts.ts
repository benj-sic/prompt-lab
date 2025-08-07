// Simple demo prompt that auto-fills a complete working example
export const DEMO_PROMPT = {
  task: 'Summarize the adverse events observed in this mock TLF dataset.',
  persona: 'You are a regulatory writer preparing a draft for FDA review. You have 15+ years of experience in clinical documentation and understand the importance of precise, compliant language.',
  context: 'The data reflects a 12-week Phase 2 study in 84 patients with moderate to severe symptoms. Mock TLF data shows 23 patients reported adverse events, with headache (12 cases), nausea (8 cases), and fatigue (6 cases) being most common.',
  constraints: 'Use a neutral tone. Limit to 150 words. Use regulatory-compliant language.'
};

// Demo iterations for demonstrating the iteration process
export const DEMO_ITERATIONS = [
  {
    name: "More Creative",
    description: "Increase temperature for more varied and creative language",
    changes: {
      temperature: 1.2,
      maxTokens: 1000,
      model: 'gemini-1.5-flash'
    },
    promptChanges: {
      task: 'Summarize the adverse events observed in this mock TLF dataset with more descriptive and engaging language.',
      constraints: 'Use a more engaging tone while maintaining regulatory compliance. Limit to 200 words. Use descriptive language and varied sentence structures.'
    }
  },
  {
    name: "More Concise",
    description: "Reduce tokens and focus on brevity",
    changes: {
      temperature: 0.3,
      maxTokens: 500,
      model: 'gemini-1.5-flash'
    },
    promptChanges: {
      constraints: 'Use a neutral tone. Limit to 100 words. Be extremely concise and direct. Use bullet points where appropriate.'
    }
  },
  {
    name: "Switch Model",
    description: "Try Gemini Pro for different capabilities",
    changes: {
      temperature: 0.7,
      maxTokens: 1000,
      model: 'gemini-pro'
    },
    promptChanges: {}
  },
  {
    name: "More Technical",
    description: "Add technical details and medical terminology",
    changes: {
      temperature: 0.5,
      maxTokens: 1200,
      model: 'gemini-1.5-flash'
    },
    promptChanges: {
      task: 'Provide a detailed technical summary of the adverse events observed in this mock TLF dataset, including medical terminology and statistical analysis.',
      constraints: 'Use technical medical language. Include statistical significance where applicable. Limit to 250 words. Use formal academic tone.'
    }
  },
  {
    name: "Patient-Friendly",
    description: "Make the language more accessible to patients",
    changes: {
      temperature: 0.8,
      maxTokens: 800,
      model: 'gemini-1.5-flash'
    },
    promptChanges: {
      persona: 'You are a medical communicator who translates complex clinical data into patient-friendly language. You have expertise in health literacy and patient education.',
      task: 'Summarize the adverse events observed in this mock TLF dataset in patient-friendly language.',
      constraints: 'Use clear, simple language that patients can understand. Avoid medical jargon. Limit to 180 words. Use an empathetic tone.'
    }
  }
];

// Helper function to get demo prompt
export const getDemoPrompt = () => {
  return DEMO_PROMPT;
};

// Helper function to get demo iterations
export const getDemoIterations = () => {
  return DEMO_ITERATIONS;
};