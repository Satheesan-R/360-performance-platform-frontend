# Settings frontend

HR can open `/hr/settings` from the workspace sidebar. Admins can open
`/admin/settings` from their dashboard. Both routes use the existing role guard.

The five sections are General, Roles & access, Review policies, Notifications,
and Performance. Admins can edit display labels for existing roles; HR sees them
as read-only. Display labels do not modify permission sets or sign-in roles.
Peer reviewers are review participants rather than a new authentication role.

This first version uses example data. Save changes stores a versioned demo in
localStorage, scoped by user and workspace role. Cancel restores the last saved
demo; changing sections preserves unsaved edits. Invalid or corrupt stored data
falls back to the examples. Storage failures retain the draft and show an error.
No settings API, organization update, email delivery, scheduler or review-cycle
change runs from these forms. Example settings are separate for each user and
role and do not synchronize between browsers or accounts.

Review policies support optional self and peer reviews, reviewer ordering and
optional calibration for Intern, Probationary and Permanent employment types.
Manager review remains required. Evidence requirements and immutable audit
history are fixed governance rules, not editable switches.

The Performance section links HR users to the existing modules and identifies
modules that are currently placeholders. Admins see the module descriptions
without links into HR-protected routes. Live organization details remain in
the existing Organization module.

Before connecting real data, add authenticated settings endpoints with server
authorization, organization-scoped persistence, validation and audit records.
Replace browser demo storage with those endpoints; enforce mandatory evidence,
audit immutability and promotion exclusions on the backend as well.

Run the settings validation checks with `npm run test:settings`.
