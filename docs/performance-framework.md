# Performance Framework frontend

The HR sidebar contains Framework Overview, Competencies & KPIs, Rating Scales &
Weightages, and Review Templates. Framework Overview and Competencies & KPIs are
connected to the backend. Scoring and review templates display upcoming-module notices.

Set `NEXT_PUBLIC_API_URL` to the backend API root, for example
`http://localhost:5000/api`. Requests use the existing Bearer session token.

Overview uses `GET /performance-frameworks` with search, status, page, and limit;
`GET /performance-frameworks/summary`; `POST /performance-frameworks`; and
`PATCH /performance-frameworks/:id`. Active employment types are loaded from
`GET /employment-types?status=active`, following every page of results.

Create/edit sends name, description, status, employment type IDs, and job-title
labels. Organization, creator, counts, and rating scale remain server-owned.
Unchanged employment type selections are omitted on edit so an existing inactive
classification does not prevent a name, description, or status update. Changing
the selection requires all remaining classifications to be active.

Competency/KPI counts include active criteria only. Rating scale remains unset.
Framework activation requires active competencies and KPIs to total 100% together;
it does not imply rating scales or review templates are ready. New frameworks start
as draft or archived. Applicable groups do not assign employees to reviews.

## Competencies & KPIs

`/hr/performance-framework/competencies` loads all pages of frameworks for its
selector. The selected framework's detail and its chosen criterion type are fetched
with abortable requests. Switching frameworks or tabs discards the prior view.
Each GET returns at most 100 embedded criteria of that type; search and status
filters run locally over this complete list. The server's scoring summary remains
unfiltered and covers active criteria in both tabs.

Endpoints, relative to the configured API root:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/performance-frameworks/:id` | Current framework status |
| GET | `/performance-frameworks/:id/competencies` | Competencies and scoring |
| GET | `/performance-frameworks/:id/kpis` | KPIs and scoring |
| POST | `/performance-frameworks/:id/competencies` | Create competency |
| POST | `/performance-frameworks/:id/kpis` | Create KPI |
| PATCH | `/performance-frameworks/:id/competencies/:criterionId` | Edit or deactivate competency |
| PATCH | `/performance-frameworks/:id/kpis/:criterionId` | Edit or deactivate KPI |

Forms send numeric weight/target values, optional description, and active/inactive
status. Competencies send technical/behavioral category. KPIs send a free-text
measurement unit, a finite target (including zero/negative values), and an optional
target period. Empty target periods are sent as an empty string to support clearing.
Server-owned IDs, arrays, counts, and scoring fields are never sent as writable data.

Deactivation uses `{ status: "inactive" }` after an inline confirmation. Archived
criteria cannot be edited; use Move to draft first. Active edits must keep the 100%
budget valid. For multi-item rebalancing, move to draft, edit, and activate again.
Activation is enabled only when the server reports valid weights. Backend errors
are displayed, and 409 conflicts require reloading before another save; there is
no automatic mutation retry. Reloading discards unsaved changes.

Framework and tab changes are disabled during editing or saving so an in-flight
mutation cannot be redirected to a different framework. After successful writes,
the selected framework and criteria are fetched again to refresh status/counts.

Verification: `npm run lint`, `npm run build`, and
`npm run test:framework`.
Live authenticated API/database verification must be done with a running backend.
