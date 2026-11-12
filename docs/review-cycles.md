# Review cycle drafts

The frontend branch `feature/review-cycles` is based on the unmerged performance-framework branch.

`/hr/review-cycles` lists paginated cycles and creates/reopens/edits drafts through
`GET/POST /review-cycles` and `GET/PATCH /review-cycles/:id`.
Requests use the existing Bearer session and `NEXT_PUBLIC_API_URL` API root.
Edits send the detail response's `__v` as `version`. A 409 blocks saving until
reload; mutations are never automatically retried. Reload/close explicitly discard
unsaved changes. Non-draft details are read-only.

Template options load all active template pages and require approvalStatus approved
and targetRole department_manager. Department options load all active pages;
empty selection inherits template departments. Employee options come from
GET /employees and include only active department_manager accounts. Participant
search and department filters preserve selected IDs, including unavailable IDs
that can be removed. The backend enforces employment-type and job-title eligibility.
Dates are shown as UTC dates; unchanged timestamp values are preserved on edits.

Approval submission/admin approval UI, reviewer assignment, publication, snapshots,
notifications and review execution are outside this milestone. An approved template
must already exist in the backend before a draft can be saved.

Verification: npm run lint, npm run build, npx tsc --noEmit,
node --test tests/review-cycle.test.mjs. Live authenticated API and database
persistence verification remains required with the backend running.
