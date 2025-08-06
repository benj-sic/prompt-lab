# Prompt Lab

A focused internal tool for prompt engineers to run experiments, track changes, and build a personal prompt engineering playbook.

## 🎯 **Purpose**

This tool is designed for **prompt engineers** to:

- **Run prompt experiments**: Test different prompts and see outputs
- **Track changes**: Document what changed, why, and whether it improved results
- **Build a playbook**: Save useful insights as reusable strategies, templates, and rules
- **Iterate quickly**: Focus on speed of iteration and clarity of logging

## Features

- **Modular Prompt Builder**: Build prompts using component-based blocks (Task, Persona, Context, Constraints, Examples, Format, Instructions)
- **Block-level Change Tracking**: Track which blocks were added, removed, or modified between experiments
- **Collapsible Block Sections**: Organize prompt components with expandable/collapsible sections
- **Real-time Prompt Assembly**: See the final assembled prompt as you build it
- **Change Tracking**: Log what changed, why, and the impact
- **Experiment History**: View all past experiments with context and block-level diffs
- **Lab Notebook**: Save insights as hypotheses, observations, methodologies, failure analysis, or insights
- **Quick Add to Lab Notebook**: One-click saving of experiment insights
- **Free API Support**: Gemini API with free tier for unlimited experimentation
- **Export/Import**: Backup and share your experiments and lab notebook

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prompt-lab
```

2. Install dependencies:
```bash
npm install
```

3. **Set up API keys** (choose one method):

#### Option A: Secure .env File (Recommended)
```bash
# Copy the example file
cp env.example .env

# Edit .env and add your API keys
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Option B: Browser Storage (Quick Start)
- Start the app and add keys through the Settings panel
- Keys are stored in your browser's localStorage

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

## API Key Setup

### Getting Free Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key (free tier)
4. Copy the key (starts with `AIza...`)

## Usage

### Basic Workflow

1. **Build a prompt**: Use the modular prompt builder with collapsible blocks
   - **Core Components**: Task (required), Persona, Context, Constraints
   - **Advanced Components**: Examples, Output Format, Instruction Style
2. **Toggle blocks**: Include/exclude specific components as needed
3. **Preview assembly**: See the final assembled prompt in real-time
4. **Add context**: Document your goal and requirements in the notes
5. **Run experiment**: Generate output and see results
6. **Track changes**: Block-level diffs show what was added, removed, or modified
7. **Save insights**: Add useful discoveries to your lab notebook
8. **Iterate**: Continue refining based on what you learn

### Experiment Management

- **View History**: All experiments are automatically saved with block-level metadata
- **Select Previous**: Click on any experiment to load its parameters and block states
- **Block-level Diffs**: See exactly which prompt components were added, removed, or modified
- **Track Changes**: When modifying a prompt, document the changes and their impact
- **Add to Lab Notebook**: Quick buttons to save insights with different categories
- **Export Data**: Download all experiments as JSON with complete block information

### Lab Notebook Categories

- **Hypotheses**: Testable assumptions about prompt engineering
- **Observations**: Empirical findings from experiments
- **Methodologies**: Systematic approaches and frameworks
- **Failure Analysis**: What didn't work and why
- **Insights**: General observations and learnings

## Project Structure

```
src/
├── components/          # React components
│   ├── PromptBuilder.tsx
│   ├── OutputDisplay.tsx
│   ├── ExperimentNotes.tsx
│   ├── ExperimentHistory.tsx
│   ├── LabNotebook.tsx
│   └── ChangeImpactForm.tsx
├── services/           # Business logic
│   ├── api.ts         # API service for LLM calls
│   └── storage.ts     # Local storage management
├── types/             # TypeScript interfaces
│   └── index.ts
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Google Generative AI**: Official Gemini API client
- **Lucide React**: Beautiful icons
- **LocalStorage**: Client-side data persistence

## Development

### Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## Why This Matters

This version of Prompt Lab becomes your personal tool for:

- **Understanding what makes prompts work**: Track changes and their impact
- **Building better templates faster**: Save successful patterns
- **Documenting reusable insights**: Build your personal knowledge base
- **Iterating efficiently**: Focus on speed and clarity

Perfect for use on projects where prompt design is iterative and high-impact.

## License

MIT License - see LICENSE file for details.
