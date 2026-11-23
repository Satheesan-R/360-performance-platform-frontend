# Reporting hierarchy frontend

`/hr/organization/hierarchy` displays saved employee-to-manager relationships
alongside department and team membership. Department heads, team leads, and
reporting managers remain independent assignments. It never infers manager edges
from roles or changes an employee's department/team as part of a manager save.

## API contract

- GET `/organization/hierarchy` loads the complete company graph with the existing
  Bearer token. The backend also supports `/hierarchy`.
- Response employees contain `_id`, firstName, lastName, employeeNumber, jobTitle,
  departmentId, teamId, and managerId. References may be populated objects or raw
  IDs. The adapter maps them to the existing internal fullName, designation, and
  reportingManagerId model while retaining department/team IDs and labels.
- PATCH `/employees/:id/manager` sends only `{ managerId: "employee-id" }`, or
  `{ managerId: null }` to make an employee top level. It does not send
  reportingManagerId or populated objects.

## Page behavior

Summary cards show employee count, employees who manage at least one known
employee, top-level employees, and employees whose chains need review. These are
computed from the complete database response, independent of current filters.

Hierarchy cards show level, direct-report count, manager, job title, employee
number, and links to department/team detail pages. A table offers the same
relationships in columns. Searches cover names, numbers, job titles, departments,
and teams. Department/team filters operate locally on the complete graph; the
team choices follow the selected department.

Matching employees retain their full ancestor chain, including managers outside
the current department/team filter. These rows are labeled Manager context.
Missing managers and existing cycles remain visible with a warning; traversal
terminates on cycles and renders each employee once.

The manager form searches the full graph, excluding the employee, all descendants,
and candidates whose own chains contain missing managers/cycles. It permits no
manager and does not apply department-head/team-lead role rules to independent
reporting relationships. Existing invalid assignments can be corrected or cleared.
The backend enforces same-company membership, existence, cycle checks, and
transactional concurrency. Errors preserve form input and mutations are not
automatically retried. Successful saves reload the graph and summary counts.

Refresh, filters, and other manager buttons are disabled while editing. Empty
organizations link to onboarding; no matches show a distinct filter-empty state.
No history, approval, review workflow, or employee reassignment is invented.

## Verification

`npm run test:organization`, `npm run lint`, and `npm run build` cover response
normalization, canonical request bodies, self/descendant blocking, invalid chains,
cross-department manager context, and rendered hierarchy/table/manager controls.
Live authenticated browser and MongoDB verification remains required. Manager
writes require the backend's transaction-capable MongoDB deployment.
