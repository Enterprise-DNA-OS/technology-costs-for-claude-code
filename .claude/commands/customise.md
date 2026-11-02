---
description: "Customise"
---

# customise

Ask what field, basis or review rule should change. Inspect the relevant migration, scripts/costs.mjs and scripts/smoke.mjs. Write a new numbered migration, preserve old runs and source evidence, update the CLI and commands, and add a meaningful regression test. Run npm test, apply npm run migrate to the intended database, and show the actual result. Never rewrite an applied migration or imply saved snapshots changed.
