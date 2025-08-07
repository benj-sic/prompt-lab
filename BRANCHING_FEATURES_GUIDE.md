# Branching Features Location Guide

## Where to Find the New Features

### Step 1: Create Multiple Runs
The branching features only appear **after you have 2+ experiment runs**. You need to:

1. **Start a new experiment**
2. **Run it once** (you'll see basic evaluation)
3. **Click "Next Iteration"** and run again
4. **Now you'll see the branching features!**

### Step 2: Evaluation Tab - Multiple Runs

When you have 2+ runs, you should see:

#### In the Header:
- **"Show Tree View" button** (next to Save/Finish buttons)

#### In the Main Content:
- **Dual Pane Comparison** (instead of simple evaluation)
- **Left/Right run selectors**
- **"Choose Run to Fork" button** (instead of "Next Run")

#### When Tree View is Enabled:
- **Interactive tree visualization**
- **Click any run to fork from it**
- **Branch colors and connections**

### Step 3: Fork Selection Modal

When you click **"Choose Run to Fork"**:
- **Modal opens** with all your runs
- **Select any run** to continue from
- **See run outputs, parameters, metadata**
- **"Continue from Run" button**

### Step 4: Iteration Tab - After Fork Selection

After selecting a run to fork from:
- **"Forking from Run X"** message in header
- **"Change Fork Point" button** to go back
- **Parameters pre-filled** from selected run
- **Prompt content inherited** from selected run

### Step 5: Tree Visualization Features

In the tree view:
- **Visual connections** between parent/child runs
- **Branch names** and colors
- **Click to fork** from any run
- **Expandable branches**

## Troubleshooting

### "I don't see the 'Choose Run to Fork' button"
- You might only have 1 run (need 2+)
- You might be in building/loading/single-run mode
- Make sure you're in **evaluation** step with **2+ runs**

### "I don't see the Tree View button"
- You might only have 1 run (need 2+)
- You might not be in evaluation step
- Look for it next to "Save Experiment" and "Finish Experiment"

### "The fork selection modal doesn't open"
- You might not have comparison notes filled in
- Validation might be failing
- Fill in comparison notes and ensure two runs are selected

## Quick Test Scenario

1. **Create new experiment** with any prompt
2. **Run it once** → should see basic evaluation
3. **Click "Next Iteration"** → modify a parameter
4. **Run again** → NOW you should see all branching features!
5. **Look for "Choose Run to Fork"** button in evaluation
6. **Look for "Show Tree View"** button in header

## If You Still Don't See Features

The features are definitely implemented. If you don't see them:
1. **Check browser console** for errors
2. **Verify you have 2+ runs** in your experiment
3. **Make sure you're in the evaluation workflow step**
4. **Try refreshing the page**
5. **Check that you have an active currentExperiment**

The branching system is fully functional - these features should appear automatically when the conditions are met!