# Leave Management System

MERN project scaffold with an Express/MongoDB API and a React/Vite client.

## Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas cluster and connection string

## Setup

### Server

```powershell
cd server
copy .env.example .env
```

Edit `server/.env` with your MongoDB Atlas URI and a strong JWT secret:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/leave-management-system
JWT_SECRET=replace-with-a-long-random-secret
```

Install dependencies and start the API:

```powershell
npm install
npm run dev
```

The health check is available at `http://localhost:5000/api/health`.

### Client

In a second terminal:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

The client uses `VITE_API_BASE_URL` from `client/.env`, defaulting to `http://localhost:5000/api`.

## Production build

```powershell
cd client
npm run build
```

The server can be started with `npm start` from `server/`.

---

# Leave Management System — Phase-Wise Build Plan (MERN)

Role-based leave management system. Employees apply for leave; managers approve/reject; system tracks leave balances by leave type.

**Stack:** MongoDB + Mongoose, Express + Node, React (Vite), JWT auth
**Models:** User, LeaveRequest, LeaveType
**Folder layout:** `server/` (models, controllers, routes, middleware) and `client/` (pages, components, services)

Each phase below is self-contained. Copy the "Prompt to AI" block for that phase into a new AI session/turn, in order. Don't skip a phase — later prompts assume earlier ones are done.

---

## Phase 0 — Project Scaffolding

**Goal:** Empty but runnable server + client, connected to MongoDB Atlas.

**Deliverables:**
- `server/` with Express app, `.env` (PORT, MONGO_URI, JWT_SECRET), `cors`, `dotenv`, Mongoose connection
- `client/` Vite React app with React Router and Axios installed, a `services/api.js` with a base Axios instance
- Root `README.md` with setup steps

**Prompt to AI:**
> Scaffold a MERN project called "leave-management-system" with two folders: `server/` and `client/`.
> Server: Express app using ES modules, `dotenv` for config (PORT, MONGO_URI, JWT_SECRET), `cors`, Mongoose connection to MongoDB Atlas with a clear error if connection fails, and a folder structure of `models/`, `controllers/`, `routes/`, `middleware/`. Add a health-check route `GET /api/health`.
> Client: React app scaffolded with Vite, React Router installed, Axios installed with a base instance in `client/src/services/api.js` that reads the API base URL from an env variable and attaches a JWT from localStorage to the `Authorization` header if present.
> Add a root README with install and run instructions for both folders.

---

## Phase 1 — User Model & Auth (Register / Login / Me)

**Goal:** Users can register with a role, log in, and fetch their own profile via JWT.

**Deliverables:**
- `User` model: name, email (unique), password (hashed), role (`employee` | `manager`), createdAt
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)
- `middleware/auth.js` — verifies JWT, attaches `req.user`
- `middleware/role.js` — restricts routes by role

**Prompt to AI:**
> In the `server/` folder, build the User model and auth flow.
> Model `User`: name (String, required), email (String, required, unique, lowercase), password (String, required, hashed with bcrypt before save), role (String, enum `employee`/`manager`, default `employee`), timestamps.
> Routes/controllers:
> - `POST /api/auth/register` — create user, hash password, return created user (no password field) and a JWT.
> - `POST /api/auth/login` — validate email/password, return JWT + user (no password).
> - `GET /api/auth/me` — protected route, returns the logged-in user's own profile.
> Middleware:
> - `middleware/auth.js` — verifies `Authorization: Bearer <token>`, decodes JWT, attaches `req.user = { id, role }`, else 401.
> - `middleware/role.js` — a `requireRole(...roles)` function usable on any route to restrict by role, else 403.
> Validate input (required fields, valid email format, password min length) and return proper status codes (200/201/400/401/404). Do not return password hashes in any response.

---

## Phase 2 — LeaveType Model & CRUD

**Goal:** Manager-configurable leave types (e.g., Sick, Casual, Earned) each with an annual quota.

**Deliverables:**
- `LeaveType` model: name (unique), description, defaultDaysPerYear
- `POST /api/leave-types` (manager only)
- `GET /api/leave-types` (paginated, any logged-in user)
- `GET /api/leave-types/:id`
- `PUT /api/leave-types/:id` (manager only)
- `DELETE /api/leave-types/:id` (manager only)

**Prompt to AI:**
> In the `server/` folder, add the LeaveType resource.
> Model `LeaveType`: name (String, required, unique), description (String), defaultDaysPerYear (Number, required, min 0), timestamps.
> Routes/controllers, all behind the auth middleware from Phase 1:
> - `POST /api/leave-types` — manager only (use `requireRole('manager')`).
> - `GET /api/leave-types` — any authenticated user, paginated (`?page=&limit=`), return `{ data, total, page, totalPages }`.
> - `GET /api/leave-types/:id` — any authenticated user.
> - `PUT /api/leave-types/:id` — manager only.
> - `DELETE /api/leave-types/:id` — manager only.
> Validate input, handle "not found" with 404, and reject duplicate names with 400.

---

## Phase 3 — LeaveRequest Model & Core CRUD

**Goal:** Employees can create, view, update, and delete their own leave requests. Managers can list all requests.

**Deliverables:**
- `LeaveRequest` model: employee (ref User), leaveType (ref LeaveType), startDate, endDate, daysRequested (computed), reason, status (`pending`/`approved`/`rejected`), decidedBy, decidedAt
- `POST /api/leaves`
- `GET /api/leaves` (manager: all, paginated + filter by status/employee; employee: own only — or use Phase 4's `/mine`)
- `GET /api/leaves/:id`
- `PUT /api/leaves/:id` (owner only, and only while `pending`)
- `DELETE /api/leaves/:id` (owner only, and only while `pending`)

**Prompt to AI:**
> In the `server/` folder, add the LeaveRequest resource, building on the User and LeaveType models from Phases 1–2.
> Model `LeaveRequest`: employee (ObjectId ref User, required), leaveType (ObjectId ref LeaveType, required), startDate (Date, required), endDate (Date, required), daysRequested (Number, computed server-side from startDate/endDate inclusive), reason (String), status (String, enum `pending`/`approved`/`rejected`, default `pending`), decidedBy (ObjectId ref User), decidedAt (Date), timestamps.
> Routes/controllers, all behind auth middleware:
> - `POST /api/leaves` — logged-in user creates a request for themselves (`employee` = `req.user.id`, ignore any employee field in the body). Validate `endDate >= startDate`. Compute `daysRequested`.
> - `GET /api/leaves` — paginated (`?page=&limit=`). If `req.user.role === 'manager'`, return all requests with optional `?status=` and `?employee=` filters. If `req.user.role === 'employee'`, return only their own requests.
> - `GET /api/leaves/:id` — a manager can view any; an employee can view only their own (403 otherwise).
> - `PUT /api/leaves/:id` — only the owning employee, and only while `status === 'pending'` (400 otherwise). Recompute `daysRequested` if dates change.
> - `DELETE /api/leaves/:id` — only the owning employee, and only while `status === 'pending'`.
> Return proper status codes throughout and populate `employee` (name, email) and `leaveType` (name) in list/detail responses.

---

## Phase 4 — Approve / Reject / My Requests / Balance (Core Business Logic)

**Goal:** The role-based workflow and leave-balance calculation that make this an intermediate project rather than plain CRUD.

**Deliverables:**
- `PATCH /api/leaves/:id/approve` (manager only)
- `PATCH /api/leaves/:id/reject` (manager only)
- `GET /api/leaves/mine` (employee's own requests, paginated)
- `GET /api/leaves/balance` — per leave type: `defaultDaysPerYear - sum(daysRequested of that employee's approved requests this year)`

**Prompt to AI:**
> In the `server/` folder, add the approval workflow and balance calculation on top of Phases 1–3.
> - `PATCH /api/leaves/:id/approve` — manager only. Only valid while status is `pending`. Before approving, recheck the employee's remaining balance for that leave type (see balance logic below); reject the approval with 400 if it would exceed their remaining days. On success set `status: 'approved'`, `decidedBy: req.user.id`, `decidedAt: now`.
> - `PATCH /api/leaves/:id/reject` — manager only. Only valid while status is `pending`. Optional `reason` in body. Set `status: 'rejected'`, `decidedBy`, `decidedAt`.
> - `GET /api/leaves/mine` — logged-in employee's own leave requests, paginated, optional `?status=` filter, newest first.
> - `GET /api/leaves/balance` — for the logged-in user, return an array of `{ leaveType, defaultDaysPerYear, daysUsed, daysRemaining }` for every LeaveType, where `daysUsed` = sum of `daysRequested` across that employee's `approved` LeaveRequests with `startDate` in the current calendar year. A manager can pass `?employee=<id>` to check someone else's balance.
> Write the balance calculation as a small reusable service/helper function (not duplicated logic) since both the approve-check and the balance endpoint use it. Return 404/400/403 appropriately throughout.

---

## Phase 5 — Frontend: Auth Pages & Route Protection

**Goal:** Login/register UI, JWT stored client-side, protected routes, role-aware navigation.

**Deliverables:**
- `client/src/context/AuthContext.jsx` (or Redux slice) holding user + token
- Pages: Login, Register
- `PrivateRoute` component (redirects to login if no token) and role-gated routes (e.g., manager-only pages)
- Axios instance auto-attaches token (already scaffolded in Phase 0) and handles 401 by logging out

**Prompt to AI:**
> In the `client/` folder, build the auth UI on top of the Phase 0 scaffold, calling the `/api/auth/*` endpoints from Phase 1.
> Use React Context (`AuthContext`) to hold `{ user, token }`, with `login`, `register`, and `logout` functions. Persist the token to `localStorage` and rehydrate on app load by calling `GET /api/auth/me`.
> Pages: `/login` and `/register` with simple forms (email/password for login; name/email/password/role for register), client-side validation, and error messages from the API surfaced to the user.
> Add a `PrivateRoute` wrapper that redirects unauthenticated users to `/login`, and a `RoleRoute` (or similar) that redirects users without the required role to a "not authorized" page.
> Axios responses with 401 should clear the stored token and redirect to `/login`.
> Use Tailwind (or plain CSS) for basic, clean styling — no need for polish yet.

---

## Phase 6 — Frontend: Employee Flow (Apply, My Requests, Balance)

**Goal:** An employee can see their leave balance, submit a new request, and track their own requests' status.

**Deliverables:**
- Page: Dashboard (shows balance summary per leave type)
- Page: Apply for Leave (form — leave type, start date, end date, reason)
- Page: My Leave Requests (list with status, pagination, cancel button for pending ones)

**Prompt to AI:**
> In the `client/` folder, build the employee-facing pages, using the auth setup from Phase 5 and calling the `/api/leaves*` and `/api/leave-types` endpoints from Phases 2–4.
> - Dashboard page: on load, call `GET /api/leaves/balance` and show a card per leave type with `daysRemaining / defaultDaysPerYear`.
> - Apply for Leave page: a form with a leave-type dropdown (populated from `GET /api/leave-types`), start date, end date, and reason. On submit, `POST /api/leaves`, show the computed `daysRequested` back to the user, and surface validation errors (e.g. insufficient balance, invalid dates) from the API.
> - My Leave Requests page: call `GET /api/leaves/mine` with pagination controls, show a table/list with leave type, dates, days, status (badge-colored), and a "Cancel" button on `pending` rows that calls `DELETE /api/leaves/:id` and refreshes the list.
> Show loading and empty states. Keep components in `client/src/components/` and pages in `client/src/pages/`, with API calls centralized in `client/src/services/`.

---

## Phase 7 — Frontend: Manager Flow (Review, Approve/Reject, Leave Types Admin)

**Goal:** A manager can review pending requests, approve/reject them, and manage leave types.

**Deliverables:**
- Page: Pending Requests (list, filter by status/employee, paginated)
- Approve/Reject actions from that list (with optimistic or refetch update)
- Page: Manage Leave Types (CRUD table)

**Prompt to AI:**
> In the `client/` folder, build the manager-facing pages (only reachable via the `RoleRoute` from Phase 5), on top of the endpoints from Phases 2–4.
> - Leave Requests Review page: call `GET /api/leaves` with pagination and `?status=` / `?employee=` filter controls. Each row shows employee name, leave type, dates, days, reason, status. For `pending` rows, show Approve and Reject buttons calling `PATCH /api/leaves/:id/approve` and `PATCH /api/leaves/:id/reject`; refetch the list after each action and surface any error (e.g. "exceeds remaining balance") from the API.
> - Manage Leave Types page: a table listing leave types (`GET /api/leave-types`, paginated) with Create/Edit/Delete using the Phase 2 endpoints, in a modal or inline form.
> Keep this section visually distinct (e.g. a "Manager" nav section) from the employee pages in Phase 6, and reuse shared components (status badge, pagination control, table) between the two.

---

## Phase 8 — Polish & Deployment

**Goal:** Production-ready and deployed on free tiers.

**Deliverables:**
- Consistent error handling middleware on the server (single JSON error shape)
- Basic tests of each endpoint in Postman (or a Postman collection export)
- Loading/error states audited across all client pages
- Deployed: MongoDB Atlas (DB), Render (API), Vercel or Netlify (client), with env vars set on each

**Prompt to AI:**
> Finish the leave management system for deployment.
> Server: add a centralized error-handling middleware returning a consistent `{ message, ... }` JSON shape for all thrown/validation errors, and a 404 handler for unmatched routes. Double-check every route from Phases 1–4 uses the auth/role middleware correctly and returns correct status codes.
> Produce a Postman collection (as JSON) covering every endpoint listed in the table below, including at least one success and one failure case each.
> Client: audit every page from Phases 5–7 for loading spinners and error messages; add a simple 404/not-authorized page and a top-level ErrorBoundary.
> Write deployment steps: MongoDB Atlas cluster + connection string, Render deployment for `server/` (build/start commands, env vars: MONGO_URI, JWT_SECRET, PORT), and Vercel/Netlify deployment for `client/` (build command, env var for API base URL, redirect rule for client-side routing). Include a final README section documenting all endpoints and how to run the whole app locally.

---

## Full Endpoint Reference

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /api/auth/register | Register a new user | Public |
| POST | /api/auth/login | Login, receive JWT | Public |
| GET | /api/auth/me | Get logged-in user profile | Authenticated |
| POST | /api/leaves | Create a new leave request | Employee |
| GET | /api/leaves | List leaves, paginated (all for manager, own for employee) | Authenticated |
| GET | /api/leaves/:id | Get a single leave request | Owner or manager |
| PUT | /api/leaves/:id | Update a leave request (while pending) | Owner |
| DELETE | /api/leaves/:id | Delete a leave request (while pending) | Owner |
| PATCH | /api/leaves/:id/approve | Approve a leave | Manager |
| PATCH | /api/leaves/:id/reject | Reject a leave | Manager |
| GET | /api/leaves/mine | My leave requests, paginated | Employee |
| GET | /api/leaves/balance | Remaining leave days by type | Authenticated |
| POST | /api/leave-types | Create a new leave type | Manager |
| GET | /api/leave-types | List leave types, paginated | Authenticated |
| GET | /api/leave-types/:id | Get a single leave type | Authenticated |
| PUT | /api/leave-types/:id | Update a leave type | Manager |
| DELETE | /api/leave-types/:id | Delete a leave type | Manager |

## Build Order Rationale

Phases 1→4 build the whole API and business logic (balance calc, approval gating) before any UI exists, so you can fully test it in Postman first. Phases 5→7 build the UI against a working, tested API, split by role so employee and manager flows don't get tangled. Phase 8 is the only place polish and deployment happen — don't deploy early, since Render's free tier cold-starts can slow down iterative testing.

---

## Deployment and Operations

### MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user and allow the deployment IP addresses in **Network Access**. For a quick hosted deployment, `0.0.0.0/0` is commonly used, but restrict it where possible.
3. Copy the driver connection string and replace the username, password, and database name.
4. Use the connection string as `MONGO_URI`. URL-encode special characters in the database password.

Example:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leave-management-system
JWT_SECRET=use-a-long-random-secret
PORT=5000
```

### Render API deployment

Create a **Web Service** from the repository with:

- Root directory: `server`
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET`, and `PORT`

Render supplies `PORT` automatically when configured; keeping `PORT=5000` as a local fallback is supported. After deployment, verify `https://<render-service>.onrender.com/api/health`.

### Vercel client deployment

Import the repository as a Vercel project with:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<render-service>.onrender.com/api`

The committed [client/vercel.json](client/vercel.json) rewrites client-side routes to `index.html` so direct visits to `/apply` and manager routes work after deployment.

### Netlify client deployment

Create a site from the repository with:

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`
- Environment variable: `VITE_API_BASE_URL=https://<render-service>.onrender.com/api`

The committed [client/public/_redirects](client/public/_redirects) file applies the SPA fallback rule during the build.

### Local production check

```powershell
cd server
npm install
npm start

# In a second terminal
cd client
npm install
npm run build
npm run preview
```

### Postman

Import [postman/leave-management-system.postman_collection.json](postman/leave-management-system.postman_collection.json). Set the collection variables `baseUrl`, `token`, `managerToken`, `employeeId`, `leaveTypeId`, and `leaveRequestId`. Run registration/login first, copy the returned JWTs into the token variables, then run the resource requests in order.

The API returns errors in a consistent shape:

```json
{
	"message": "Validation failed.",
	"errors": {
		"field": "A useful validation message."
	}
}
```

All endpoints are listed in the **Full Endpoint Reference** above. Public endpoints are registration, login, and health. Authenticated endpoints require `Authorization: Bearer <token>`. Manager-only endpoints are leave-type create/update/delete and leave approval/rejection.