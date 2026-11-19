# Goals & OKRs — frontend first version

Open `/hr/goals` from the HR sidebar. The existing HR route guard protects the workspace.

HR can create, edit and delete objectives with organization, team or individual scope, an owner name, start/end dates and draft, active, completed or archived status. Search matches objective titles, descriptions, owners and key result titles. Scope and status filters work together.

Each objective has at least one numeric key result with a baseline, target, current value and unit. Progress is `(current - baseline) / (target - baseline)`, clamped to 0–100%, with equal weighting across key results. This supports increasing and decreasing targets. Targets cannot equal baselines. Completion requires every key result to reach its target. These are initial frontend rules for review, not a backend scoring policy.

Records use browser localStorage under `performance-goals-drafts:v1:<user-id>`. They are drafts scoped to the signed-in account in this browser, not server records or secure shared storage. There are no seeded employee records or sample objectives. Storage errors preserve the current form; invalid saved data blocks writes rather than silently replacing existing records.

Review-cycle association, employee ID assignment, organization/team IDs, objective cascading, check-in history, permissions beyond HR, and shared persistence are pending backend contract confirmation. Dates are explicitly chosen and are not forced into quarters. Goal progress does not feed framework scores or reviews in this version.

## Manual verification

1. Sign in as HR and open Goals & OKRs. Confirm an empty workspace and the browser draft notice.
2. Create an objective with dates and two key results: 0→100 at 50 and 8→4 at 6. Save; overall progress should be 50%.
3. Refresh the page. Confirm the draft remains. Search by owner or key result and combine scope/status filters.
4. Edit current values to their targets and mark completed. Try completing an objective with unfinished results; confirm validation prevents saving.
5. Cancel unsaved edits. Confirm the saved objective is unchanged. Delete a draft, first choosing Keep objective, then confirming deletion.
6. Check narrow layouts and keyboard access to fields, details, filters and actions. Verify storage failure reports an error without closing the editor.

Automated domain checks: `node --test tests/goals.test.mjs`.
