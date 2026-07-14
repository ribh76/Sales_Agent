# Evaluation Plan

The V1 evaluation compares SalesCompass against a simple baseline that recommends a broad ICP from industry and company stage alone.

## Metrics

- Specificity: Does the answer name a narrow segment?
- Evidence quality: Does the answer explain which inputs drove the recommendation?
- Actionability: Can a seller act on the next steps this week?
- Risk handling: Are weak signals and disqualifiers visible?
- Message quality: Are outbound angles tailored to the chosen segment?

## Process

1. Select a demo profile.
2. Generate the baseline output.
3. Generate the SalesCompass agent output.
4. Score both outputs with deterministic rubric checks.
5. Let a human add a final rating and notes.

