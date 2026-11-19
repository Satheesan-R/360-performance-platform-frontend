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
GET /employees. Participants include only active department_manager accounts. Participant
search and department filters preserve selected IDs, including unavailable IDs
that can be removed. The backend enforces employment-type and job-title eligibility.
Dates are shown as UTC dates; unchanged timestamp values are preserved on edits.

Approval submission/admin approval UI, publication, snapshots,
notifications and review execution are outside this milestone. An approved template
must already exist in the backend before a draft can be saved.

Verification: npm run lint, npm run build, npx tsc --noEmit,
node --test tests/review-cycle.test.mjs. Live authenticated API and database
persistence verification remains required with the backend running.

## Reviewer assignments

The draft editor loads the selected template detail and uses its frozen framework's
`enabledReviewers`. HR selects a participant, an enabled role, and an active reviewer.
Self uses the participant automatically. Peers require department_manager accounts;
Team Lead requires tech_lead; manager uses the participant's managerId reporting link.
Reviewers can be outside the selected participant list. The backend remains the
source of truth for organization and account eligibility.

Saved assignments load on reopening. Every save sends the full reviewerAssignments
array; clearing sends []. Edits include the loaded __v as version. A 409 blocks
saving and offers an explicit reload. Removing a participant removes assignments
for that participant. Changing template clears participants and assignments.
Department changes preserve selections for correction by HR. Existing or unavailable
reviewer IDs remain visible and removable. Assignments are optional and incomplete
coverage does not block draft saving. No reviews are started by saving.

Manual verification with an authenticated HR account: select a template with enabled
roles; add self, peer, manager and Team Lead assignments where enabled; save/reopen;
remove and clear assignments; test a draft changed in another tab and reload after
409. Verify disabled roles and inactive reviewers are absent. Verify unavailable
saved reviewers can be removed. Publication and reviewer form execution are future work.
