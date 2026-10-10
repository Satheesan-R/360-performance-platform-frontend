# Organization Management API contract

This frontend implements the six Organization pages for one company. The backend repository and its endpoint definitions were not provided, so the following is the **assumed contract**, not a verified description of the existing backend.

Configure `NEXT_PUBLIC_API_URL` with the Express API base URL, including any prefix such as `/api`. Requests use the existing session's `Authorization: Bearer <token>` header. The backend must permit the frontend origin through CORS and authorize every read and write. Existing HR route protection continues to apply; custom role creation alone does not change login or route authorization.

Change endpoint paths in `services/organization.service.ts`. Change field mappings in that service when the backend uses different names or populated relationships. No sample organization data is used as a fallback.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/organization` | Organization details |
| PATCH | `/organization` | Update organization details |
| GET | `/organization/summary` | Summary counts |
| GET, POST | `/departments` | List/create departments |
| PATCH | `/departments/:id` | Update a department |
| GET, POST | `/teams` | List/create teams |
| PATCH | `/teams/:id` | Update a team |
| GET, POST | `/employment-types` | List/create employment types |
| PATCH | `/employment-types/:id` | Update an employment type |
| GET, POST | `/roles` | List/create roles |
| PATCH | `/roles/:id` | Update a role |
| GET | `/permissions` | Available assignable permissions |
| GET | `/organization/hierarchy` | Flat employee list with reporting relationships |
| PATCH | `/employees/:id/reporting-manager` | Assign or remove a reporting manager |
| GET | `/employees` | Existing employee selector endpoint |

Details and summary responses can be returned directly or inside `{ "data": ... }`. List responses can be arrays, `{ "data": [...] }`, or named arrays: `departments`, `teams`, `employmentTypes`, `roles`, `permissions`, and `employees`. These pages currently expect complete lists; adapt the service and table controls if the backend paginates results.

Writes accept the bodies below. A successful HTTP response is sufficient; the page reloads its list/details after saving. Errors should return `{ "message": "A useful explanation" }` with the appropriate HTTP status.

## Organization

```json
{
  "_id": "organization-id",
  "name": "Company name",
  "code": "COMPANY",
  "logoUrl": "https://example.com/logo.png",
  "industry": "Technology",
  "description": "Company description",
  "contactEmail": "hr@example.com",
  "country": "Sri Lanka",
  "timezone": "Asia/Colombo",
  "status": "active"
}
```

PATCH uses these fields without `_id`. `logoUrl` is optional; this version accepts a URL rather than uploading a file. Validate company code uniqueness, email, logo URL, country, and timezone on the backend.

Summary response:

```json
{ "totalEmployees": 31, "departments": 3, "teams": 6, "activeReviewFrameworks": 2 }
```

## Departments, teams, employment types, and roles

All records use `_id`, `name`, `code`, `description`, and `status` (`active` or `inactive`). Writes omit `_id` and computed counts.

Department response:

```json
{ "_id": "department-id", "name": "Engineering", "code": "ENG", "description": "Engineering department", "status": "active", "departmentHeadId": "employee-id", "employeeCount": 18 }
```

Team response:

```json
{ "_id": "team-id", "name": "Platform", "code": "PLAT", "description": "Platform team", "status": "active", "departmentId": "department-id", "teamLeadId": "employee-id", "employeeCount": 8 }
```

Employment type response:

```json
{ "_id": "employment-type-id", "name": "Full-time", "code": "FULL_TIME", "description": "Permanent employees", "status": "active" }
```

Role response:

```json
{ "_id": "role-id", "name": "HR Coordinator", "code": "HR_COORDINATOR", "description": "Manage organization structure", "status": "active", "permissions": ["organization.read", "departments.manage"] }
```

Permission response entry:

```json
{ "key": "departments.manage", "label": "Manage departments", "description": "Create and update departments" }
```

Employee selector entries use the existing `/employees` contract: `_id`, `firstName`, `lastName`, `workEmail`, and `employeeNumber`, optionally `fullName`.

Empty `departmentHeadId` or `teamLeadId` means unassigned. Adapt those values to `null` in the service if required by your backend. Team department selection is required. The backend should validate references, unique codes, counts, deactivation rules, and permission grants; it must prevent users granting permissions they are not authorized to manage.

## Reporting hierarchy

Each hierarchy entry contains:

```json
{ "_id": "employee-id", "fullName": "Priya", "designation": "Engineering Manager", "departmentName": "Engineering", "reportingManagerId": null }
```

Manager assignment body:

```json
{ "reportingManagerId": "manager-employee-id" }
```

Send `null` to make an employee top level. The UI prevents selecting the employee or their descendants. The backend must also reject cycles, self-reporting, and nonexistent employees. Missing relationships and existing cycles are displayed for correction.

## Existing onboarding

Employee Onboarding retains its existing request contract and hardcoded options. Replacing those fields with organization IDs needs agreement with the employee API; it should be a coordinated change across both repositories.

## Validation

Run `npm run test:organization`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. After aligning the contract, verify against your backend: edit organization details; add and edit each structure type; search and filter; assign heads/leads; save permissions; assign/remove a manager; and confirm validation/403 errors preserve the form input.
