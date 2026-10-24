# Five-Case Test Report
**Project**: AI Study Support Agent (CS101: Python Academic Tutor)  
**Team**: Team 1  
**Target Syllabus**: Python Variables & Data Types, Control Flow & Functions, Object-Oriented Programming (OOP)

---

## Summary Table

| Test ID | Scenario Type | Input Topic / User Action | Expected Behavior | Observed Result (Live Deployment) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Normal Case 1** | Topic: `"Python list mutability and tuples"` | Agent searches demo material (`search_material`), matches `SEC-PY-101`, generates 3 MCQs on mutability and typing. User completes quiz; application code calculates score; proposes 3 study activities citing `SEC-PY-101`. User confirms and saves plan to PostgreSQL. | *(Pending live execution)* | PENDING |
| **TC-02** | **Normal Case 2** | Topic: `"Functions and variable scope"` | Agent matches `SEC-PY-102`, generates 3 MCQs on `def`, `return`, and local scope. Student intentionally misses 2 questions. Tool `check_assessment` calculates score `1/3` in code and produces remedial study plan focusing on Section 2. User confirms & saves. | *(Pending live execution)* | PENDING |
| **TC-03** | **Normal Case 3 & Reopen** | Topic: `"OOP classes and inheritance"` | Agent matches `SEC-PY-103`, generates 3 MCQs on `class`, `self`, and `super()`. User gets 3/3; confirms plan. User navigates to "Reopen Plan" and verifies that the saved plan is retrieved from remote PostgreSQL by ID. | *(Pending live execution)* | PENDING |
| **TC-04** | **Ambiguous / Incomplete** | Topic: `"Python"` *(or "Coding")* | Agent identifies that the query is overly broad. It halts quiz generation and asks clarification: *"Our course has 3 modules: Section 1 (Variables & Data Structures), Section 2 (Functions & Loops), and Section 3 (OOP). Which topic would you like to assess?"* | *(Pending live execution)* | PENDING |
| **TC-05** | **Out of Scope / Error Guardrail** | Topic: `"SQL Joins and Relational Keys"` *(or "Quantum Computing")* | Agent invokes `search_material`, finds 0 matches in Python syllabus. Agent halts tool calls gracefully and displays: *"This topic is outside the available Python course material."* Prevents runaway tool loops. | *(Pending live execution)* | PENDING |

---

## Known Limitations & Boundaries
1. **Single Course Syllabus**: Scoped strictly to the 3 demo sections (`SEC-PY-101`, `SEC-PY-102`, `SEC-PY-103`).
2. **Quota Management**: Inference runs on Google AI Studio Gemini Free Tier, adhering to the 15 Requests-Per-Minute rate limit.
3. **Deterministic Scoring**: Assessment scoring is strictly evaluated via application code comparison rather than generative evaluation to guarantee numerical accuracy.
