# Performance Framework frontend

The HR sidebar contains Framework Overview, Competencies & KPIs, Rating Scales &
Weightages, and Review Templates. Only Framework Overview is connected to the
backend in this milestone. The other routes display upcoming-module notices.

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

Competency/KPI counts currently come back as zero and rating scale is unset.
Active status records administrative intent; it does not imply scoring or review
templates are ready. Applicable groups do not assign employees to reviews.

Verification: `npm run lint`, `npm run build`, and
`node --test tests/performance-framework-service.test.mjs`.
Live authenticated API/database verification must be done with a running backend.
