# Goals & OKRs — backend integration

Open `/hr/goals` from the HR sidebar. The existing HR route guard protects the workspace.

The HR workspace now uses `services/goals.service.ts` and the shared Axios client in `lib/api.ts`. Set `NEXT_PUBLIC_API_URL` to the backend root, normally `http://localhost:5000/api`. Every request carries the existing session's Bearer token. Backend authorization and validation errors remain visible, with unsaved form input preserved.

Create a dated goal plan, then create draft objectives in it. Owners are selected by employee ID from employees with active accounts; team objectives additionally select an active team. The backend checks company access and owner/team membership. Individual goals derive their team from their owner. Plan, scope, owner and team links are immutable after creation; goal dates come from the plan.

Add increasing, decreasing or milestone key results to a saved objective. The initial measurement equals the baseline. Activate the plan and objective before recording check-ins. Check-ins save an absolute measurement and optional note; their paginated history is available from each key result. After the first check-in, the metric definition is locked, while title and unit remain editable. The UI renders the backend's progress and overdue values rather than recalculating them using the old draft rules.

Complete an active objective only when all results reach their targets. Cancel an objective instead of deleting it; the API has no deletion endpoints and preserves history. HR can reopen completed/cancelled objectives while the plan is active. Closing a plan freezes objectives/check-ins and cannot be undone. Closed plans can be archived. Status changes require confirmation in a separate form.

The service follows the existing backend contract in `../360-performance-platform-backend/docs/goals-api.md`:

| Operation | Endpoint |
| --- | --- |
| List/create plans | `GET/POST /goal-plans` |
| Change plan status | `PATCH /goal-plans/:id` |
| List/create objectives | `GET/POST /goals` |
| Edit objective or change status | `PATCH /goals/:id` |
| Add key result | `POST /goals/:id/key-results` |
| Edit key result definition | `PATCH /key-results/:id` |
| Record/list progress history | `POST/GET /key-results/:id/check-ins` |
| Employee and team options | `GET /employees`, `GET /teams` |

Lists use the backend's named resource arrays and `pagination` object; writes use `plan`, `goal`, or `keyResult` wrappers. Objective filters (`planId`, `level`, `status`) and pagination are server-side. The backend does not support text search; the UI explicitly labels search as applying to the current page. Plans and active teams load all option pages.

Legacy drafts remain untouched under `performance-goals-drafts:v1:<user-id>` in localStorage. They are not displayed as server goals or automatically uploaded: owner names, dates and archived status cannot be safely mapped to employee IDs, goal plans and the backend lifecycle. `goals-draft.service.ts`, the old editor, and draft domain helpers remain for compatibility with that data. The active HR workspace no longer reads or writes browser drafts.

Scope is the HR workspace. Employee goal pages remain placeholders. The UI does not yet expose parent-goal cascading or plan metadata editing, though the backend supports those operations. Goal plans are separate from review cycles; goals do not feed framework scoring.

The backend requires a configured organization, activated owner accounts and transaction-capable MongoDB (Atlas or a replica set) for transactional goal writes. Match the backend's `FRONTEND_URL` to the frontend origin for CORS.

## Manual verification

1. Start the backend and frontend; sign in as HR and open `/hr/goals`.
2. Create a dated plan, create an objective with an active employee owner, and add two results: increasing 0→100 and decreasing 8→4.
3. Activate the plan, then the objective. Record check-ins of 50 and 6; overall progress should be 50%. Refresh and confirm persistence and history.
4. Edit titles/units; confirm metric fields are locked after check-in. Try completing unfinished results and confirm the server error preserves the confirmation form.
5. Check in at the targets, complete the objective, reopen it, then cancel it. Confirm history remains available. Close the plan and confirm editing/check-in actions disappear.
6. Verify plan/scope/status filters, page navigation, page-local search, empty states, failed-request retries and narrow layouts. Stop the backend during a save and confirm the form remains open without duplicate records being submitted automatically.
7. Verify an old localStorage draft is unchanged after all server operations. Do not use live company records for destructive lifecycle checks.

Automated frontend checks: `npm.cmd run test:goals`. Service tests use mocked Axios responses and cover authentication, endpoint contracts, server filters, pagination, option loading, lifecycle requests, check-ins and error propagation. Draft-domain tests remain for legacy data. Backend tests: `node --test ../360-performance-platform-backend/test/goals.test.js` (mocked database/transactions and local HTTP routes).

Live authenticated browser/database persistence must still be verified with a running backend. Automated service tests are not proof of a live MongoDB connection.
