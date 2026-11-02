# Validation

2 November 2026. Implementation commit ab99ff7.

## Automated checks

[Verification run 41539428020](https://github.com/Enterprise-DNA-OS/technology-costs-for-claude-code/actions/runs/41539428020) passed all five jobs:

- Linux, Node 20: npm ci, npm test and npm run demo PASS.
- Linux, Node 22: npm ci, npm test and npm run demo PASS.
- Windows, Node 20: npm ci, npm test and npm run demo PASS.
- Windows, Node 22: npm ci, npm test and npm run demo PASS.
- PostgreSQL 17, Node 22: npm ci and npm test PASS.

The smoke suite reports 264 checks across all 25 CLI commands. There are 29 operating slash commands plus the command index. Tests cover idempotent migrations and seed, exact positive and negative allocation, source controls, dry-run and atomic import rejection, duplicate imports, stale input detection, independent review, immutable evidence, ambiguous matches, backup overwrite rejection, reports and HTML escaping.

The first remote run exposed an assertion that assumed a random ID ordering. The corrected test checks both candidates independently. A subsequent migration formats report amounts to two decimal places. The final run above covers both changes on all five jobs.

## Documents and page evidence

npm run view and npm run docs render the weekly dashboard, departmental statements and source reconciliation sheets. The dashboard was inspected in a headless browser after correcting amount formatting. No application server is shipped.

Three real CLI captures from the fictional seeded database are preserved in docs/demo-captures.json and copied into the landing page. The Command Centre page gate passes with seven sourced money figures and no brand violations. README, operating instructions and prose documents pass brand lint. No TODO(author), em dash or banned phrase remains in authored files.

GitHub visibility is PRIVATE. The page writer pushed the noindex, unlinked page. Publication belongs to the runner. Command Centre registry changes are left for its runner to commit.

The final landing page was inspected at desktop width 1440 and mobile width 390 in a headless browser. It renders noindex,nofollow, contains six correctly tagged booking links and has no horizontal mobile overflow. Invalid icon names found during inspection were corrected and the page passed the gate again before its final push. The gate also passed against the rendered HTML. All preview servers and browsers were closed.

The public URL returned HTTP 404 during the handoff checks. A successful source push and local rendering are verified; production deployment availability is not claimed.
