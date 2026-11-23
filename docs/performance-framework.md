# Performance Framework frontend

The HR sidebar contains Framework Overview, Competencies & KPIs, Rating Scales &
Weightages, and Review Templates. Framework Overview and Competencies & KPIs are
connected to the backend, along with Rating Scales & Weightages and Review Templates.

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

Competency/KPI counts include active criteria only. Rating scale remains unset until configured.
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

## Rating Scales & Weightages

`/hr/performance-framework/scoring` shares the complete framework selector. It uses
`GET /performance-frameworks/:id/scoring`,
`PATCH /performance-frameworks/:id/scoring`, and
`POST /performance-frameworks/:id/scoring/preview` with the existing Bearer session.

Unconfigured values remain blank. Each section has an Include checkbox; unchecked
sections are omitted from saves and proposed previews, preserving their saved
values. Drafts can save a subset of sections. Scale ranges are 1–3, 1–4, or 1–5,
with editable labels. Every included category/reviewer weights block must be
complete and total 100%; disabled reviewers must have zero weight and enabled
reviewers must have positive weight. Reviewer weights and enabledReviewers are
always saved together. Disabling a reviewer sets their weight to zero and does not
redistribute it to other roles.

Criterion, competency-category, and reviewer weights are separate layers.
Category weights redistribute the competency share while leaving KPI weights
unchanged. The server checks criteria/category compatibility and saved readiness.
The page displays validation.ready/message and supports moving to draft before
reconfiguration or activating a saved ready framework. Archived settings are read-only.

Preview saved settings posts `{}`; Preview changes posts only selected blocks
inside configuration. Sample ratings cover every enabled reviewer and every
positive-effective-weight criterion. All effective weights, scores, reviewer
contributions, and normalized percentages come from the backend. The minimum
rating maps to 0%, the maximum to 100%. Previews never save configuration/results.
Draft edits invalidate the displayed preview, and changing sample ratings clears
the old sample result. Display formatting rounds to four decimal places only.

Dirty settings and in-flight requests lock framework switching. Save/reload
refreshes the selected framework and scoring; reloading discards unsaved changes.
A 409 save conflict blocks further saves until reload, with no automatic retries.
The saved configuration version is shown for reference. This UI does not publish
cycles or create snapshots. The backend snapshot endpoints remain available for
future review-cycle integration; publication must store a snapshot ID/version and
use its detached configuration rather than mutable live framework settings.

## Review Templates

`/hr/performance-framework/templates` uses `/review-templates` relative to the API
root. The list uses server search, status/framework filters, and pagination. List
references are populated; the editor fetches detail with raw reference IDs. All
framework and active employment-type selector pages are loaded.

New templates start as draft. The editor supports framework targeting, global
evidence requirements, up to 50 ordered sections, and 200 questions (20 per
section). Each section selects competencies/KPIs once across the whole template,
with required, comments, required comments, and evidence flags. Global evidence
requirements take precedence in the backend preview. Empty employment-type
selections inherit framework targeting. Explicit types must be active and within
framework restrictions. Unchanged existing employment selections are omitted from
PATCH so metadata edits can preserve later-deactivated classifications.

Sections are sent as a whole replacement array, preserving existing section and
question IDs. New nested entries omit IDs; local UI keys and server-owned fields
are removed. Client validation checks text/reference limits, nested identities,
duplicate criteria, comments policy, and the backend's 20 KB UTF-8 JSON limit.
Changing a draft's framework clears criterion/type selections while keeping
section identities, titles, and questions.

Active templates edit against their pinned frameworkSnapshot. Moving to draft
clears that pin and uses current live criteria. Archived templates can be
previewed or returned to draft; their section editor is disabled. Activation is a
separate confirmed action offered after saved preview reports readiness. The
server revalidates complete coverage of all positive-effective-weight criteria.
Archive and status changes send only status. A 409 conflict requires reloading
before retrying; mutations are never automatically retried.

Saved preview uses GET `/:id/preview`; proposed edits use POST to the same path.
Create a draft before previewing a new template. Returned sections, pinned/live
version, rating labels, effective weights, missing references, comments, and
effective evidence flags are rendered without answer fields or upload controls.
Editing a field clears any proposed preview. No review responses are collected.

Snapshots uses POST `/:id/snapshots` with `{}` for saved active templates. It
displays the resulting ID, template/framework versions, timestamp, and detached
section content. GET `/:id/snapshots/:snapshotId` opens an earlier snapshot by ID;
there is no listing API. Snapshot contents resolve criteria from their own frozen
framework, never from live records. Repeated creation for the same version is
idempotent. This page does not publish cycles or edit/delete snapshots.

Restart the updated backend before testing. Live authenticated frontend/MongoDB
verification remains necessary; automated tests use mock API responses and also
render preview content to verify pinned/missing criteria and evidence rules.
