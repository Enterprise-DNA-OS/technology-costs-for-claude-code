---
description: "Add a period, department or shared service"
---

# add

Add a period, department or shared service.

```bash
npm run costs -- add period --name="<period>" --currency=NZD --due=<date> --retain-until=<date>
```

Replace placeholders with supplied facts. Read before writing. Use --json on CLI reads when structured output helps. If a match is ambiguous, show the returned candidates and ask the operator to identify the record. Report the period, currency and whether the allocation is draft, stale or reviewed.

Other forms: `npm run costs -- add unit --name="<name>" --owner="<owner>"` and `npm run costs -- add service --name="<name>" --owner="<owner>" --basis="<measured usage basis>"`. Set retention from the business's jurisdiction and policy.

Return generated files in the conversation. Never send or post anything.
