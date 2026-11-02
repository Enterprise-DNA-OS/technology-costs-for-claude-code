# Evidence checks and retention

Checked 2 November 2026. This base prepares management allocations. It does not calculate tax, transfer prices, statutory accounts or payments and does not certify legal compliance.

## Cited obligations

[New Zealand Inland Revenue: records of income and expenses](https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses) says business sales and purchase records must be retained for seven years. Original invoices and other source records remain outside this database. Set each period's retention_until from the actual legal and business policy, including any longer hold. The demo date is an example, not an automatic legal calculation.

[ASIC: company financial reports](https://www.asic.gov.au/for-business-and-companies/companies/company-financial-reports) is the starting point for Australian company record obligations. Confirm the applicable entity requirements and retention period before deployment. This tool does not determine them from currency.

[IBM: export data](https://www.ibm.com/docs/en/apptio-platform/apptio-bi/saas?topic=reports-export-data) explains that visualization filters carry into the CSV and column totals are omitted. Independent controls are therefore required for an import; summing the same export is not independent reconciliation.

## Implemented checks

| Rule | Behaviour | Authority |
|---|---|---|
| SOURCE_CONTROL | Compare imported row count and signed total with recorded independent controls | House reconciliation policy, informed by IBM export limits |
| SOURCE_REFERENCE | Flag missing source evidence references | House evidence policy |
| DRIVER_AGE | Flag measured usage older than 45 days | House freshness policy, not law |
| REVIEW_DUE | Flag overdue periods not fully reviewed | Operator-set due date and house policy |
| RETENTION_REVIEW | Flag an elapsed retention date for human review; never delete | Operator's policy informed by the cited record obligations |
| Independent review | A different named person must review; block approval with missing drivers or changed inputs | House separation-of-duties policy |
| Append-only evidence | Costs, import controls, allocation runs, reviews and notes reject updates and deletions | House traceability policy |

A name supplied to the CLI is not authentication. A database owner has privileged access. Shared deployment requires actual access controls, backups, restore practice and retention storage. Date checks cannot prove originals exist or that backups are usable. Corrections add evidence; they do not rewrite old snapshots.
