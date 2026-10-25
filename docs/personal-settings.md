# Personal Settings

Workspace Settings buttons open a shared modal above the current page and main sidebar, keeping the URL, page state and scroll position. The modal uses a native dialog for keyboard focus containment and inert background content, locks background scrolling, and supports Close, Escape and backdrop dismissal. Unsaved edits require confirmation before closing; dismissal is blocked while a save or password change is in progress. Closing restores the saved appearance and returns focus to the launcher (or the mobile menu button).

The canonical personal page `/settings` remains available for bookmarks and legacy redirects for every authenticated account.
It has the same eight sections and component tree for Admin, HR, Manager,
Team Lead and Employee. Peer is currently a review assignment, not a backend
authentication role; peer reviewers use the same page through their normal
sign-in account. No new role, login system or per-role preference model is added.

Old `/hr/settings`, `/admin/settings`, `/employee/settings`, `/manager/settings`
and `/tech-lead/settings` URLs redirect to `/settings`.

The existing business configuration component and its demo storage are preserved
at `/hr/configuration` and `/admin/configuration`. HR workspace navigation and the
Admin dashboard link to those areas separately. Organization management,
performance frameworks, review execution and other existing business routes are
not removed or merged into Personal Settings. The earlier Git stash is untouched.

## Existing API integration

Both repositories were inspected. The sibling backend at
`../360-performance-platform-backend` already contained the settings module and
authenticated profile/password endpoints. Those endpoints are reused, not copied
into a separate personal-profile service or authentication model.

| API | Behavior |
| --- | --- |
| `GET /api/settings/profile` | Own sanitized account/linked employment details, personal activity timestamps and capabilities |
| `PATCH /api/settings/profile` | Existing endpoint; only permitted phone/address fields, applied to the caller's linked employee |
| `PATCH /api/settings/password` | Existing endpoint; verifies current password and stores a new bcrypt hash |
| `GET /api/settings/preferences` | Added to the existing module; reads personal preferences from the existing User document |
| `PATCH /api/settings/preferences` | Added to the existing module; validates and saves only personal preferences |

The existing User schema now embeds preferences and a password-change timestamp.
There is no new collection or duplicate preference endpoint per role. Profile
DTOs contain only the requested self-service fields; password hashes and other
employees' records are never returned. Team/department names and the reporting
manager's name come from references on the caller's own linked employee.

The request chain uses the existing JWT authentication middleware, then checks
the active database account and current role before any settings action. Setup
tokens, inactive users and stale role claims are rejected. Ownership comes from
the verified token, never request body/query IDs. Personal updates use explicit
allowlists and reject role, department, reporting-manager, employment-policy and
mandatory-security overrides. Landing pages are checked against available routes
for the database role, preventing cross-role destinations and open redirects.

Password changes reuse the existing bcrypt flow, require the current password,
reject unchanged/short passwords and enforce bcrypt's 72-byte UTF-8 limit. A
conditional update protects against concurrent password changes. Credentials
remain only in component/request memory, clear on success or leaving the section,
and never enter preference storage, events or local storage. Managed identities
with no local password capability are directed to their organization/IT process;
no alternate local-password creation path is provided. Existing activation/login
flows remain separate. Production-wide rate limiting/session invalidation policy
remains an authentication-service concern, not a new browser mechanism.

## Personal behavior

- **General:** English (the currently supported locale), time zone, and only
  existing landing pages for the caller's role. Login goes through `/dashboard`,
  which validates the saved destination again before navigating.
- **Appearance:** Light, Dark and System Default. The root preference provider
  applies the selected mode to the existing application palette across routes;
  System Default follows device changes. Cancel/leaving Settings restores an
  unsaved theme preview. Preferences survive reloads through the server.
- **Notifications:** frequency, category channels, reminder schedules, mentions
  and replies, approvals and status changes, and role-specific manager alerts.
  The five original switches remain account preferences; advanced delivery
  choices are saved per account in this browser. Mandatory security remains
  enabled and is not an editable API field. Delivery is not connected yet.
- **Profile:** linked employment details, photo upload with square cropping,
  short bio, self-assessed skills, career interests with audience controls,
  professional links, contact edits, and employment correction requests.
  Extended controls use the backend update described in
  [profile-settings.md](profile-settings.md); older servers retain contact editing.
- **Security and Login:** secure existing password endpoint, validation and
  server errors. MFA status is explicitly unavailable because no enrollment or
  status endpoint exists.
- **Account:** own account ID, role/status and guidance for the organization's
  established HR/IT support process. The help option does not send a request.
  No self-role-assignment or managed-account deactivation action exists.
- **Privacy and Activity:** only the caller's available last-login and
  password-change timestamps. No organization audit or employee-list endpoint
  is fetched. Business access continues to use the existing module RBAC.
- **Devices and Sessions:** current local browser distinguished clearly.
  Remote session inventory/revocation is not supported and its action is
  disabled. Local sign-out clears this browser's session and makes no claim
  to revoke tokens on other devices.

The common page includes loading, retry, empty, disabled, field error, save error,
success, cancellation and unsaved-navigation states. Profile/password operations
never fall back to pretend server saves. Only explicit 404/501 responses from
the preferences endpoint enable the labelled browser-only preview, stored under
`personal-preferences:v1:<account-id>`. Network/authorization/server failures do
not silently switch to mock success. Switching signed-in accounts resets the
page/provider and prevents the previous account's draft/theme from leaking.

## Verification and rollout

Run `npm run test:personal-settings`, existing frontend checks and `npm run build`.
In the backend, run `npm test` (including `test/personal-settings.test.js`).
Browser verification exercises the real Express settings routes/JWT middleware
with an isolated in-memory database fixture; it does not modify real employees
or demonstrate a live MongoDB connection. Existing backend suites also mock
database operations. Restart/deploy the updated backend through the project's
usual process before expecting the new preferences endpoint and capabilities on
a running server. No deployment or production data migration is performed here.

## Notification settings

The Notifications section supports these preferences and explains them inline:

| Setting | Intended delivery behavior when a delivery service is connected |
| --- | --- |
| Notification frequency | Immediate emails, a daily digest, or a weekly digest at the selected day/time. In-app events remain immediate. |
| Channels by category | Email and in-app choices for goals, reviews, feedback, development, mentions, approvals, and manager alerts. Neither selected mutes the category. The optional email master switch suppresses emails without clearing channel choices. |
| Reminder schedule | One reminder 1–30 days before a deadline, plus an independently optional reminder the day after an incomplete item is overdue. Uses the chosen time in the General time zone. Weekdays-only moves weekend reminders to the preceding Friday. Completed items are excluded. Reminders use their own schedule rather than digest timing. |
| Mentions and replies | Independent choices for direct mentions and replies to conversations the user participates in. |
| Approvals and status changes | Independent choices for incoming approval requests, decisions on submitted items, and workflow stage changes. |
| Manager alerts | Pending team approvals and overdue team review summaries at the reminder time, plus at-risk goal events following the email frequency. Summary timing follows weekdays-only. Visible to managers, team leads, HR, and admins; delivery must enforce authorized team scope. |

Category channels and the email master switch apply to all optional event and
reminder choices. Mandatory security notifications cannot be disabled.

The current backend accepts only `email`, `goals`, `reviews`, `feedback`, and
`development` notification booleans. Channel changes for the latter four keep
their legacy enabled flag in sync (either channel selected means enabled).
Advanced settings are allowlisted and validated under `notifications.delivery`,
but excluded from account API writes. With server preferences, they persist at
`personal-notification-delivery:v1:<encoded-account-id>` in local storage and
are merged on load. With the existing missing-API preview, the whole preference
object uses the existing browser preview key. Invalid or older records acquire
safe defaults, preserving previously muted categories. Browser storage failures
are reported, including when account preferences already saved successfully.

The page explicitly describes the browser-only scope. No email sender, in-app
notification inbox, event subscription, or background scheduler is implemented
by these controls. The table defines the contract for a future delivery service;
it does not describe active delivery. Browser-only advanced settings would need
server persistence before a background service could consume them.

## Appearance

Appearance uses System, Light and Dark preview cards, the shared 360 Corporate theme, and Blue, Teal or Violet accents. Background and foreground swatches reflect the active mode and contrast setting; arbitrary color entry is intentionally unavailable. Advanced controls set the application base font size (14–18 px), reduced motion (System/On/Off), and higher contrast. Code editor controls are omitted because this platform has no code editor.

These options live in `User.preferences.appearance`, validated by the existing authenticated self-service preference endpoint. Older records and browser previews receive defaults without a migration. Changes preview globally; Cancel or leaving Settings restores the saved appearance. Save uses the existing server/browser source and reports which one was updated. System mode and motion follow OS preference changes. The backend must be restarted with the updated schema and validator before new options can be saved.
