# Demo Examples: IND eCTD Module 2 Summary Iterations

A demonstration of prompt engineering improvements for generating IND eCTD module 2 summaries from study reports.

## The Scenario
You're generating an IND eCTD module 2 summary from an uploaded study report. Each iteration improves one specific component while keeping others fixed.

---

### Iteration 1: Amend Task Component  
**Comment:** Needs stronger regulatory framing and specific section requirements

**Changed Component:**
[Task] ➔ Compose a concise paragraph summarizing the key safety findings from the attached study for Module 2.4 per ICH M3(R2) guidelines. Include study design, critical results, toxicokinetics, NOAEL determination, and clinical implications.

---

### Iteration 2: Amend Persona Component  
**Comment:** Persona too generic for regulatory context

**Changed Component:**
[Persona] ➔ Senior regulatory toxicologist with FDA submission experience

---

### Iteration 3: Amend Constraints Component  
**Comment:** Need to enforce critical details and conciseness

**Changed Component:**
[Constraints] ➔ Strict 250-word limit. Must include quantitative reversibility evidence, toxicokinetic parameters, explicit NOAEL, and human dose projection. Use complete sentences without subsections.

---

## Insights & Recommendations

Task improvements add regulatory structure and ICH compliance requirements. Persona improvements add regulatory expertise and FDA terminology. Constraint improvements ensure critical data inclusion and precise language.

