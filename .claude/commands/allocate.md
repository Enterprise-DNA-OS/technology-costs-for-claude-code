---
description: "Save an allocation with its source snapshot"
---

# allocate

Save an allocation with its source snapshot.

```bash
npm run costs -- allocate --period="<period>" --actor="<actual preparer>" --purpose="<purpose>"
```

Replace placeholders with supplied facts. Read before writing. Use --json on CLI reads when structured output helps. If a match is ambiguous, show the returned candidates and ask the operator to identify the record. Report the period, currency and whether the allocation is draft, stale or reviewed.

Return generated files in the conversation. Never send or post anything.
