# Prompt Lab

A powerful prompt engineering experimentation tool that helps you build, test, and iterate on AI prompts systematically.

## Features

### Experiment Workflow
- **Build**: Start by building your prompt using modular components (Task, Persona, Context, Constraints, Examples, Format, Instructions)
- **Run**: Execute your prompt and see the AI output in real-time
- **Evaluate**: Rate and assess each run with detailed feedback and observations
- **Iterate**: Make changes and run again to see how modifications affect output
- **Compare**: Analyze differences between runs to understand the impact of changes
- **Save**: Store all experiments in your lab notebook for future reference

### Key Improvements

#### Simplified Interface
- **Less Prominent Demo**: Demo button is now subtle colored text instead of a prominent button
- **Unified Components**: All prompt components (core and advanced) are now in one section
- **Streamlined Parameters**: Model parameters are collapsible and always accessible

#### Improved Workflow
1. **Start with Building**: The workflow begins with prompt construction
2. **Clear Run Button**: "Run Experiment" button appears when you have valid prompt content
3. **Output Display**: Results appear immediately after running
4. **Evaluation Step**: After output, an evaluation section appears for scoring and notes
5. **Next Run**: "Next Run" button clears the screen and saves the current run to history
6. **Iteration**: You can modify one variable at a time and run again
7. **Comparison**: Compare two runs side-by-side with highlighted differences
8. **Sidebar History**: All runs are saved as sidebar items/tabs
9. **Experiment Completion**: Finish experiments and save to lab notebook

#### Enhanced Evaluation
- **5-Star Rating System**: Rate each run from 1-5 stars
- **Quality Assessment**: Categorize as Excellent, Good, Fair, or Poor
- **Detailed Observations**: Add comprehensive notes about each run
- **Tagging System**: Add custom tags to categorize and organize runs
- **Visual Feedback**: See evaluation summaries in the run history

#### Smart Comparison
- **Similarity Scoring**: Automatic calculation of output similarity
- **Parameter Tracking**: Highlight changes in temperature, tokens, and model
- **Difference Analysis**: Identify unique words and phrases between runs
- **Insight Generation**: Automatic analysis of what the differences mean

### Technical Features

- **Modular Prompt Building**: Break down prompts into logical components
- **Real-time API Integration**: Direct connection to Gemini API
- **Persistent Storage**: All experiments saved locally
- **Dark/Light Theme**: Toggle between themes for comfortable use
- **Responsive Design**: Works on desktop and mobile devices
- **Export/Import**: Share experiments with others
- **Theme-Adaptive Logo**: Periodic table style "PL" logo that adapts to light/dark themes

## Getting Started

1. **Setup API Key**: Follow the [API Setup](#api-setup) instructions above
2. **Load Demo**: Click "Load demo prompt" to see a working example
3. **Build Your Prompt**: Use the modular components to construct your prompt
4. **Run Experiment**: Click "Run Experiment" to test your prompt
5. **Evaluate Results**: Rate and add notes about the output
6. **Iterate**: Make changes and run again to see improvements
7. **Compare Runs**: Use the comparison tool to analyze differences
8. **Save to Notebook**: Complete experiments are saved to your lab notebook

## Workflow Example

1. **Build**: Create a prompt with Task, Persona, and Context components
2. **Run**: Execute and see the AI response
3. **Evaluate**: Rate 4/5 stars, mark as "Good", add notes about tone
4. **Iterate**: Change the Persona component to be more specific
5. **Run Again**: Execute the modified prompt
6. **Compare**: See how the more specific persona changed the output
7. **Evaluate**: Rate the new run and note improvements
8. **Finish**: Save the experiment to your lab notebook

## API Setup

This app requires a Gemini API key to run experiments. Here's how to set it up:

### Option 1: Environment Variables (Recommended)
1. Copy `env.example` to `.env` in the project root
2. Get your free API key from [Google AI Studio](https://aistudio.google.com/)
3. Add your API key to the `.env` file:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```
4. Restart the development server

### Option 2: Settings Panel
1. Run the app and click the "Settings" button
2. Enter your Gemini API key
3. The key will be saved locally

### Getting Your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key" in the top right
4. Create a new API key or use an existing one
5. Copy the key and add it to your `.env` file

**Note**: The free tier includes 15 requests per minute and 1500 requests per day.

## Development

```bash
npm install
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

### Core Components
- `App.tsx`: Main application component with workflow management
- `PromptBuilder.tsx`: Modular prompt construction interface
- `DualPaneRunComparison.tsx`: Side-by-side run comparison tool
- `ExperimentTreeVisualization.tsx`: Visual experiment branching tree
- `LabNotebook.tsx`: Experiment history and management
- `ApiErrorDisplay.tsx`: Error handling and API status display

### Services
- `api.ts`: Gemini API integration and experiment execution
- `storage.ts`: Local storage management for experiments and settings

### Utilities
- `demoPrompts.ts`: Pre-built demo prompts for quick testing

### Documentation
- `README.md`: Main project documentation
- `SETUP.md`: Quick setup guide
- `DEMO_EXAMPLES.md`: Detailed workflow examples
- `BRANCHING_FEATURES_GUIDE.md`: Branching feature documentation

## Recent Cleanup

The codebase has been cleaned up to remove unused components and improve maintainability:

### Removed Unused Components
- `ExperimentHistory.tsx`: Replaced by integrated LabNotebook
- `EnhancedRunComparison.tsx`: Functionality merged into DualPaneRunComparison
- `ExperimentLabNotebookEntry.tsx`: Integrated into LabNotebook
- `OutputDisplay.tsx`: Replaced by inline output display
- `RunComparison.tsx`: Replaced by DualPaneRunComparison
- `ExperimentNotes.tsx`: Integrated into evaluation workflow
- `ForkRunModal.tsx`: Functionality moved to DualPaneRunComparison
- `ForkSelectionModal.tsx`: Integrated into DualPaneRunComparison
- `ParameterControls.tsx`: Replaced by IterationParameterControls
- `ExperimentRuns.tsx`: Integrated into LabNotebook
- `PromptInput.tsx`: Replaced by PromptBuilder

### Removed Unused Utilities
- `experimentTree.ts`: Tree logic integrated into ExperimentTreeVisualization
- `theme.ts`: Theme management moved to ThemeContext

### Maintained Components
All remaining components are actively used and essential to the application workflow.
