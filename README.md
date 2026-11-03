# Technology Costs for Claude Code

Allocate shared technology costs to departments and explain every cent. A focused, owned alternative for teams using IBM Apptio Costing for this part of their work.

Built by **Enterprise DNA**. MIT licence. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Install the database and commands below. | Your cost pools, allocation rules, documents and Apptio exports mapped across. | Installed, connected and operated through Omni by Enterprise DNA. Setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=ibm-apptio-costing) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=ibm-apptio-costing) |

## Quick start

Node 20 or newer. No database service is needed for the demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/technology-costs-for-claude-code.git
cd technology-costs-for-claude-code
npm install
npm run demo
npm run costs -- allocate --period="October 2026" --actor="Your actual name" --purpose="Review demo costs"
npm run view
npm run docs
```

All demo businesses, people and records are fictional. The database is embedded PGlite in .data/db. Set DATABASE_URL for shared Postgres and run npm run migrate. Keep the owner connection private. This base has no sign-in service. A hosted installation needs access controls, backups and retention policies.

## What the base does

Store period costs, services, departments, measured usage, budgets and source controls. Allocate a service's net costs using positive integer usage weights. Save the inputs, results, preparer and purpose. Keep reviews and explanations as append-only evidence. Changed inputs mark a saved allocation stale. Approval requires another named person and a fully allocated period.

The allocation uses exact integer cents and largest remainders. Ties break on stable department IDs. Credits use the same weights and sign. Missing weights stay visibly unallocated, including a net-zero pool. Each period has one currency. There is no currency conversion, tax calculation, payment, invoice issue or accounting-ledger posting.

IBM Apptio is broader: this base covers one-stage shared-service allocation and departmental statements. It does not reproduce its full cost-model hierarchy, integrations, planning suite or benchmarks. Enterprise DNA scopes those requirements when building your version. [Research and candidate scores](docs/research.md).

## The weekly rituals

Read `/attention`, refresh `/drivers`, inspect `/allocation-preview`, save `/allocate`, obtain `/review`, then prepare `/draft-statement` and `/weekly-review`. The weekly review draws on attention, budget variance and evidence checks.

| Command | Result |
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

CLI reads accept --json. Exact names match without case. Partial names and ID prefixes work when unique. Ambiguous matches list candidates and exit 1. Unknown verbs fail.

## Bring an Apptio export across

Create the destination period, services and departments first. Apptio reports are configurable, so inspect the actual report columns and map them explicitly. The example headers are a supported mapping, not a universal Apptio format.

```bash
npm run costs -- import apptio --period="October 2026" --file=examples/apptio-costs.csv --map=examples/mapping.json --actor="Your actual name" --source-ref="Unfiltered cost report" --expected-count=2 --expected-total=80.01 --dry-run
```

Review the result, then repeat without --dry-run. A single command imports a prepared cost export. The count and total must come from an independent report control. Currency mismatches, duplicate IDs, unknown services and mismatched totals reject the whole import. Repeating the same file does nothing. A different file containing existing source IDs fails: use explicit correction entries, not overwritten history. Raw columns and the file fingerprint are retained. [Export, mapping and migration limits](docs/replace-ibm-apptio-costing.md).

## Ten questions to ask

These are answered by this base today. Apptio can also answer many of them when configured. We make no claim that its broader platform cannot do so.

1. Which services have costs but no measured usage? `exceptions`
2. What share of support does each department carry, down to the cent? `allocation-preview`
3. How does a hosting credit affect departmental shares? `allocation-preview`
4. Which departments exceed their budget after shared costs? `variance`
5. Which allocation changed after a reviewer checked it? `attention`
6. Which usage measurements are more than 45 days old? `compliance`
7. Which imported counts and totals fail their source controls? `compliance`
8. What exact costs and weights supported an earlier allocation? `run`
9. Who rejected an allocation, and what evidence did they give? `run`
10. Which period needs review first, including periods never allocated? `attention`

## Your first hour: ten things to ask for

1. Put our name, colours and logo in brand.json.
2. Add this month's period and its currency.
3. List the departments and who owns each budget.
4. Name the shared services and their usage measures.
5. Map our Apptio report columns.
6. Reconcile the source export to independent counts and totals.
7. Record staff counts, storage or other measured usage.
8. Preview the shares and investigate missing measurements.
9. Save an allocation and have another person review it.
10. Draft the departmental statement and export a backup.

## Documents and views

npm run docs generates branded departmental cost statements and source reconciliation sheets in docs-out/. npm run view generates views/week.html. Both are local read-only HTML with escaped record values. No server or front end is built. `/new-view` adds a report. The operator chooses where private reports are stored and who can read them.

## Review and retention

A name in a CLI command is attribution, not authentication. Never act as another reviewer. A privileged database owner can bypass the model's controls, so do not treat it as a tamper-proof vault. Run snapshots preserve prior weights and budgets. Source files and original invoices need independent retention and backup. `/compliance` checks evidence and deadlines, not legal compliance certification. [Sources and rules](docs/compliance.md).

## Validation

npm test creates a temporary database, migrates and seeds twice, exercises all 25 CLI commands, tests signed rounding, source rejection, review gates, historical snapshots, ambiguity, backups and HTML escaping. The manual workflow covers Node 20/22 on Windows and Linux and PostgreSQL 17. Actual run evidence belongs in docs/validation.md.

## Architecture

One CLI in scripts/costs.mjs. Plain Postgres migrations in supabase/migrations. PGlite and Postgres share the adapter in scripts/lib/db.mjs. views.json and documents.json define read-only reports. brand.json supplies the business identity. Commands are shared across agent runtimes through AGENTS.md and CLAUDE.md.

MIT. Built and optionally operated through [Omni by Enterprise DNA](https://enterprisedna.co/omni/instead-of/ibm-apptio-costing?utm_source=github&utm_medium=readme&utm_campaign=ibm-apptio-costing).
