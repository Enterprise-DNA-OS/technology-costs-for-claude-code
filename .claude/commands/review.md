---
description: "Record a separate person's review"
---

# review

Record a separate person's review.

```bash
npm run costs -- review <run-id> --actor="<actual reviewer>" --decision=approved --conclusion="<conclusion>" --evidence="<reference>"
```

Replace placeholders with supplied facts. Read before writing. Use --json on CLI reads when structured output helps. If a match is ambiguous, show the returned candidates and ask the operator to identify the record. Report the period, currency and whether the allocation is draft, stale or reviewed.

Use the actual reviewer's identity. Never impersonate one or approve on the preparer's behalf. To reject, use --decision=rejected and explain the unresolved issue. A later review is a new record. Read the run before recording a decision.

Return generated files in the conversation. Never send or post anything.
