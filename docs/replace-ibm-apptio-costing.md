# Move a cost export from IBM Apptio Costing

Checked 2 November 2026. [IBM's export instructions](https://www.ibm.com/docs/en/apptio-platform/apptio-bi/saas?topic=reports-export-data).

## Export with the right scope

In Apptio BI open the authorised report and use the chosen visualization's menu to export CSV. Your role needs ExportCSVFeatureFullAccess and access to the report. IBM documents that filters affect exported rows and column totals are omitted. The download is available through its export notification or interface.

Choose a cost-detail report with a stable unique record identifier, service, amount and currency. If a visualization aggregates rows, that report is not source transaction history. Keep a copy of the source, record filters and reporting period, and obtain the independent row count and signed total before migration.

## Map once, import in one command

Create a period with `add period`, each department with `add unit` and each service with `add service`. See `/add` for the forms. Edit a copy of examples/mapping.json to name your report's columns. Mapping keys are source_id, service, amount, currency and optional description. Headers match without case. The example headers are illustrative, not asserted to be IBM defaults.

```bash
npm run costs -- import apptio --period="October 2026" --file=examples/apptio-costs.csv --map=examples/mapping.json --actor="Your actual name" --source-ref="Report name and filter scope" --expected-count=2 --expected-total=80.01 --dry-run
```

Inspect the result. Repeat without --dry-run. It imports all rows in one transaction. Amounts must be signed decimals with at most two places and no separators. Dates and amounts from a formatted spreadsheet need a deliberate transformation before import. Each source ID must be unique in the period. Repeated identical bytes do nothing. Existing source IDs from a changed file reject the import. Corrections use separately identified adjustment rows, preserving history.

## Check what carried over

Run `imports`, `costs`, `drivers`, `allocation-preview` and `exceptions` for the period. Imported count and total must agree to independent controls. Each period has one currency. All source columns are retained as raw values, but only the mapped fields drive calculations.

This moves cost records. It does not migrate Apptio formulas, hierarchies, transformations, budgets, usage weights, access roles, integrations or attachments. Add the usage weights and budgets with set-driver and set-budget. Enterprise DNA maps and tests the broader operating model as part of a customised version.

## Parallel check before replacing anything

Compare one complete period in both systems. Investigate every difference in source scope, credits, weights and rounding. Have the actual reviewer examine the saved run and source documents. Keep Apptio until the required workflows and history are accounted for. Do not cancel a subscription or delete anything automatically.

Export a complete JSON backup with `npm run costs -- export --file=<new-file>`. It preserves all domain records and refuses overwrites. Restore is an operator-reviewed database task, not an automatic CLI command.
