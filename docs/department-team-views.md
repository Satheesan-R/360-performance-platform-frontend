# Department, team, and employee frontend views

The Departments and Teams pages now use `StructureDirectory`, with canonical
`headEmployeeId`, `teamLeadEmployeeId`, and populated department references. Existing
Organization styles, cards, hover treatments, and shared controls are retained.

## Navigation and reads

- `/hr/organization/departments`: paginated search/status list, global department
  summary, team/employee counts, View/Edit/Deactivate actions.
- `/hr/organization/departments/:id`: Overview, Teams, Employees, Hierarchy.
- `/hr/organization/teams`: paginated team list and creation/edit forms.
- `/hr/organization/teams/:id`: Team details and Employees, with a breadcrumb back
  to the parent department.

Requests use the existing `NEXT_PUBLIC_API_URL` root (normally ending in `/api`)
and Bearer login token. Filters and pagination go to the backend; changing filters
remounts the data view and aborts previous requests. Department summaries remain
independent of search/status filters. Employee tables use directory-only fields;
personal contact and birth-date data are not rendered.

Department/team detail reads, scoped team lists, scoped employee lists, and the
department hierarchy use the endpoints in the backend handoff guide. The hierarchy
keeps inactive/empty teams, renders employees without a team separately, and labels
`team-not-in-department` stale references. Search filters displayed employees while
retaining the complete team structure. It is a full graph response, not paginated.

## Writes and safety

Department forms send `headEmployeeId`, team forms send `teamLeadEmployeeId`, and
unassigned heads/leads send `null`. Only editable fields are sent; counts and
populated objects are not written back. All department-option pages are loaded.
Create and edit use POST/PATCH and refresh affected views on success.

Department-head choices include only employees whose account role is
`department_manager`; team-lead choices include only `tech_lead`. Unknown roles
are excluded. Existing assignments with a different role must be replaced by an
eligible employee or cleared to Unassigned before saving the form.

Department deactivation uses DELETE `departments/:id`, preceded by an inline
confirmation explaining that the head, teams, and employee assignments remain.
There is no permanent-delete UI. Reactivate through the department edit form.

The team Employees tab loads candidate employees from its department endpoint,
with search and pagination. Assignment sends `{ teamId }`; removal sends
`{ teamId: null }`. Candidates already in the team cannot be selected. Moving an
employee from another team requires explicit confirmation. New memberships are
disabled unless both team and parent department are active. Manager links are
not modified. Department changes send `{ departmentId }` or null with a warning
that incompatible team membership is cleared. The backend enforces eligibility,
transactions, and the populated-team move restriction; its errors are shown
without automatic retries. Successful writes reload detail counts and directories.

Head, lead, and manager are independent relationships. Counts include pending
onboarding and disabled accounts. No History/Approvals tabs or mock records exist.

## Verification

Run `npm run lint`, `npm run test:organization`, and `npm run build`. Tests cover
authenticated requests, pagination, canonical fields/null clearing, assignment
payloads, safe deactivation calls, conflict propagation, and hierarchy rendering.
Live browser/API/MongoDB verification remains necessary. Restart the updated
backend; assignment/team-move writes require Atlas or a replica set.
