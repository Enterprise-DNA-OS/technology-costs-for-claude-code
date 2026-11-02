# Technology Costs for Claude Code

For the person who explains shared technology costs to department owners. Ask for the real period, currency, source report, measured usage and actual preparer. Demo records are fictional.

## Rules

Read before changing anything. Keep currencies separate. Read docs/compliance.md before discussing a control. Never invent a usage measurement or source control. Use the operator's actual identity. A review belongs to a different real person, never a second name invented by the agent.

All sends, accounting postings and payments are outside this base. Draft files only and return them in chat. Do not overwrite source history or old runs. Correct a source error with explicit new correction entries. Use a new migration for model changes.

## Commands

| Ask | Result |
|---|---|
| `/periods` | List cost periods and review deadlines |
| `/units` | List departments and their owners |
| `/services` | List shared services and their allocation basis |
| `/costs` | Read the source costs for a period |
| `/drivers` | Read measured usage and its evidence |
| `/imports` | Check imported source controls |
| `/allocation-preview` | Preview departmental shares without saving |
| `/allocate` | Save an allocation with its source snapshot |
| `/runs` | List saved allocations |
| `/run` | Read an allocation and its review history |
| `/review` | Record a separate person's review |
| `/showback` | Show which department carries each cost |
| `/variance` | Compare departmental costs with budgets |
| `/exceptions` | Find costs with no positive usage weights |
| `/attention` | Find periods awaiting work or independent review |
| `/compliance` | Check source controls, evidence age and retention review |
| `/add` | Add a period, department or shared service |
| `/set-driver` | Record measured usage and its source |
| `/set-budget` | Set a departmental period budget |
| `/log` | Record the explanation behind a cost decision |
| `/history` | Read period discussion notes |
| `/import` | Import an Apptio report after reconciling independent controls |
| `/export` | Write a complete JSON backup to a new file |
| `/weekly-review` | Draft the weekly cost review from attention, variance and compliance |
| `/draft-statement` | Draft departmental cost statements |
| `/documents` | Render branded statements and reconciliation sheets |
| `/views` | Render a read-only weekly cost dashboard |
| `/customise` | Change the model with a tested migration |
| `/new-view` | Add a read-only report |

Use npm run costs -- help for the CLI list. CLI reads support --json. Names match without case and IDs by prefix. If the CLI gives multiple candidates, show them and ask which record. Use the recipes in .claude/commands for exact arguments.

## Evidence and states

One-stage weighted allocation conserves signed cents. A missing driver remains UNALLOCATED. Departmental statements are drafts until independent review. Any changed cost, weight or budget makes the prior run stale. The snapshot in each run preserves the inputs as they were. A source hash detects differences, not privileged tampering.

Before import, inspect the Apptio report, filters and mapping. Obtain independent count and total, dry-run, then import. Read docs/replace-ibm-apptio-costing.md. Do not pretend export mappings transfer model formulas, authentication or integrations.

Keep owner database connections private. This is a trusted local agent interface, not an authenticated web service. Source documents stay under the business's access and retention policies. No customer records belong in this repository.

## Files

scripts/costs.mjs is the CLI. scripts/lib/allocation.mjs holds exact cents and allocation. supabase/migrations holds versioned schema. views.json and documents.json hold read-only report definitions. brand.json supplies identity. npm test uses a temporary embedded database. TEST_DATABASE_URL is only for a fresh disposable PostgreSQL database.

Built and optionally operated through Omni by Enterprise DNA.
