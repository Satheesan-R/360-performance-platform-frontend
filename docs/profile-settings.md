# Expanded Profile settings

The Profile section now contains About me, Skills and expertise, Career
interests, Professional links, Employment details, Personal contact details,
and Request a correction. Typography matches Notifications. Drafts survive
switching settings sections. Cancel restores saved values, and unsaved profile,
crop, correction, and review-note edits participate in the existing close and
navigation protection.

## Available controls

- Photo: JPG, PNG, or WebP up to 5 MB; adjustable square crop with zoom and
  horizontal/vertical positioning. The browser re-encodes the crop as a
  256×256 JPEG. Replace/remove are supported; initials remain the fallback.
  The saved photo appears in the Settings header.
- Bio: 500 characters.
- Skills: up to 20 unique names, self-assessed proficiency, and a development
  interest checkbox. Skills can be added, edited, and removed.
- Career interests: 1,000 characters; private by default, or explicitly shared
  with the assigned reporting manager and HR/admin. Private interests remain
  excluded from other users' profile responses, including HR responses.
- Professional links: up to 5 labelled HTTP/HTTPS links. Script URLs and
  URLs containing credentials are rejected. External links open with
  `noopener noreferrer`.
- Contact details: existing capability-based phone/address editing is retained.
  Personal contact data is excluded from the colleague profile endpoint.
- Corrections: job title, department, and reporting manager, with proposed
  value and reason. History shows pending/approved/rejected decisions and HR
  notes. HR/admin have a pending review queue, excluding their own requests.

## Backend integration

The frontend and sibling `360-performance-platform-backend` are updated.
Restart the backend process, or allow the existing development watcher to reload,
to expose the new capabilities. Until then, extended editing controls are disabled
based on server capabilities and existing phone/address editing remains available.
Photo selection and cropping remain available for a local preview, independent
of server support. Saving rechecks capabilities so a server reload can be detected
without discarding the selected crop. Unsupported saves report an error and retain
the draft rather than claiming the photo was saved.
New profile details and corrections never fall back to browser-only storage or
pretend submissions. No deployment or real employee data changes were performed.

The update extends the existing User with a typed `profileDetails` subdocument,
adds a ProfileCorrection collection, extends the existing settings module,
and adjusts the JSON body limit only for the authenticated profile endpoint.
The existing preference, password, and employee schemas/flows are preserved.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/settings/profile` | Existing own profile plus details and capabilities |
| `PATCH /api/settings/profile` | Existing contact edits or a separate allowlisted `details` update |
| `GET /api/settings/profiles/:id` | Active colleague's professional profile, with career-interest access checks |
| `GET /api/settings/corrections` | Latest 100 own requests |
| `POST /api/settings/corrections` | Submit a request derived from the verified account/linked employee |
| `GET /api/settings/corrections/review` | Latest 100 pending requests for authorized HR/admin review |
| `PATCH /api/settings/corrections/:id` | Approve/reject; rejection requires a note |

Approvals update the official record and review decision in the same MongoDB
transaction. A department must match one existing active department by exact
name; its incompatible team assignment is cleared. Reporting manager requests
use employee numbers and reuse existing hierarchy cycle validation. The company
hierarchy-version lock serializes reporting edits with the existing workflow.
MongoDB transaction support is required, as with the existing manager-assignment
feature. An already-reviewed request, self-review, stale original record, or
cross-company employee is rejected. A partial unique index permits only one
pending request per employee account and field.

## Verification

- `node --test tests/personal-settings.test.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- Targeted ESLint checks for the new profile components, model, and service.
- `node node_modules/next/dist/bin/next build`
- `node --test` in the sibling backend: all 45 tests pass, including the existing
  organization, hierarchy, and settings suites and 9 new profile tests.
  Database calls/transactions are mocked; this checks behavior and permissions,
  not a live MongoDB transaction or browser crop UI.
- `node tests/profile-photo.browser.mjs` with the frontend running: launches an
  isolated headless Chrome profile with mocked API responses, verifies the native
  file chooser event, loads and crops a fixture image, checks unsupported save
  errors preserve the draft, and saves after capabilities become available.
  Uses no real signed-in session or backend records. `FRONTEND_URL` and
  `BROWSER_EXE` can override the local URL and browser executable. Restricted
  execution environments may require `BROWSER_NO_SANDBOX=1` for this isolated
  fixture browser.
