---
description: "Import an Apptio report after reconciling independent controls"
---

# import

Import an Apptio report after reconciling independent controls.

```bash
npm run costs -- import apptio --period="<period>" --file=<csv-path> --map=examples/mapping.json --actor="<actual person>" --source-ref="<report and filters>" --expected-count=<rows> --expected-total=<decimal> --dry-run
```

Replace placeholders with supplied facts. Read before writing. Use --json on CLI reads when structured output helps. If a match is ambiguous, show the returned candidates and ask the operator to identify the record. Report the period, currency and whether the allocation is draft, stale or reviewed.

Read docs/replace-ibm-apptio-costing.md. Check the report scope, filters and independent control total. Obtain the operator's mapping. Run the dry run first, inspect it, then repeat without --dry-run to import. Never invent identifiers or controls.

Return generated files in the conversation. Never send or post anything.
