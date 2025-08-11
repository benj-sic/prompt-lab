# Demo Examples: IND eCTD Module 2 Summary Iterations

A demonstration of prompt engineering improvements for generating IND eCTD module 2 summaries from study reports.

## The Scenario
You're generating an IND eCTD module 2 summary from an uploaded study report. Each iteration improves one specific component while keeping others fixed.

---

### Iteration 1: Amend Task Component  
**Comment:** "The summary is missing explicit references to ICH guidelines and lacks the necessary regulatory context for an IND submission."

**Changed Component:**
[Task] ➔ Compose a concise paragraph summarizing the key safety findings from the attached study for Module 2.4 per ICH M3(R2) guidelines.

---

### Iteration 2: Amend Persona Component  
**Comment:** "This reads like a generic summary, not a regulatory analysis. It needs to adopt the tone and perspective of a seasoned toxicologist."

**Changed Component:**
[Persona] ➔ Senior regulatory toxicologist with FDA submission experience

---

### Iteration 3: Amend Constraints Component  
**Comment:** "The summary is still missing critical quantitative details. We need to ensure the NOAEL and evidence of reversibility are explicitly stated."

**Changed Component:**
[Constraints] ➔ Strict 250-word limit. Must include quantitative reversibility evidence and an explicit NOAEL.

---

## Insights & Recommendations

- **Task**: Explicitly referencing ICH guidelines (e.g., ICH M3(R2)) in the task description frames the output in a regulatory context, improving compliance and relevance.
- **Persona**: Defining a specific, expert persona (e.g., "senior regulatory toxicologist") helps the model adopt the appropriate tone, terminology, and analytical perspective.
- **Constraints**: Adding specific, non-negotiable constraints (e.g., "must include quantitative reversibility evidence") ensures that critical data points are included in the output.

