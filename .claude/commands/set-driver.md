---
description: "Record measured usage and its source"
---

# set-driver

Record measured usage and its source.

```bash
npm run costs -- set-driver --period="<period>" --service="<service>" --unit="<department>" --weight=<integer> --measured-on=<date> --actor="<actual person>" --evidence="<reference>"
```

Replace placeholders with supplied facts. Read before writing. Use --json on CLI reads when structured output helps. If a match is ambiguous, show the returned candidates and ask the operator to identify the record. Report the period, currency and whether the allocation is draft, stale or reviewed.

Return generated files in the conversation. Never send or post anything.
