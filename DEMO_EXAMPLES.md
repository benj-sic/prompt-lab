# Demo Examples: Quick Iterations

A simple demonstration of prompt engineering improvements with focused iterations.

## The Scenario
You're analyzing adverse event data from a clinical trial. Each iteration addresses one specific issue.

## Iteration 1: Initial Analysis

**Comment:** "Too generic - just lists numbers without insights"

**Actual Output:** "Adverse events in the mock TLF data were reported by 23 patients. The most frequent were headache, nausea, and fatigue."

**Fix - Task Component:**
```
Analyze the adverse events and identify the three most concerning safety signals.
```

---

## Iteration 2: Add Clinical Expertise

**Comment:** "Needs clinical depth - just lists percentages without interpretation"

**Actual Output:** "Analysis of the mock Therapeutic Lifecycle Management (TLM) data reveals adverse events (AEs) in 23 of the enrolled patients. The most frequently reported AEs were headache (12 cases), nausea (8 cases), and fatigue (6 cases). These findings suggest a relatively manageable AE profile, dominated by mild to moderate symptoms commonly associated with various medical interventions."

**Fix - Persona Component:**
```
You are a clinical safety specialist with 15+ years of experience in pharmacovigilance.
```

---

## Iteration 3: Add Constraints

**Comment:** "Too verbose - needs to be more concise and focused"

**Actual Output:** "Based on the provided data from a 12-week Phase 2 study involving 84 patients (60% female, mean age 45), the overall incidence of adverse events (AEs) appears relatively low, with 23 out of 84 participants (approximately 27%) reporting at least one AE. The most frequently reported AEs were headache (12 cases), nausea (8 cases), and fatigue (6 cases)."

**Fix - Constraints Component:**
```
Limit to 100 words. Be concise and direct.
```

---

## Demo Workflow

1. Start with base prompt → Show generic output
2. Add specific task → Show focused analysis  
3. Add clinical expertise → Show deeper interpretation
4. Add constraints → Show concise output

## Key Points

- Each iteration solves one specific problem
- Focus on single component changes
- Show clear improvement in output quality
- Use evaluation notes to document progression

---

## Final Study Report: Insights & Recommendations

After completing all iterations, here are the insights and recommendations that could be entered when saving the experiment:

### Insights & Recommendations:
- Specific task requirements dramatically improve output focus
- Expert personas transform generic responses into professional analysis
- Constraints help control output length and style
- Start with clear, specific task requirements
- Include appropriate expert personas for domain content
- Use constraints to control output length and tone

