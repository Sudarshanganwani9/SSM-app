# SSM — Company Employee Management System

A complete, production-oriented HR / Employee Management System built for **SSM**. Two roles —
**Admin** and **Employee** — get fully separate, real (not mocked) experiences: authentication,
employee profiles, Punch In/Out attendance, leave management with an approval workflow, a holiday
calendar, Compensatory Off (COF) for Sunday work, in-app notifications, reports, and admin settings.

Every feature listed below is wired end-to-end: real database models, real validation, real
role-based authorization on the backend (the frontend never assumes the API will "just do the
right thing" — every Admin-only route is protected with server-side middleware regardless of what
the UI shows).

---

## 1. Tech stack

**Frontend** — React 19 + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook
Form + Zod, Lucide icons, Recharts, react-hot-toast.

**Backend** — Node.js + Express, MongoDB + Mongoose, JWT auth (httpOnly cookie *and* Bearer
header supported), bcryptjs password hashing, express-validator, multer (file uploads),
nodemailer (optional SMTP), node-cron (COF expiry job), json2csv (report export).

**Timezone**: all attendance/leave/COF business logic is calculated in `Asia/Kolkata` (configurable
via `APP_TIMEZONE`), independent of the server's OS timezone.

---

## 2. Folder structure

```
ssm-app/
  server/                     Express API
    src/
      config/db.js            Mongo connection
      models/                 12 Mongoose models
      middleware/              auth, error handler, validation, file upload
      controllers/             one per feature area
      routes/                  one per feature area, mounted under /api/*
      services/                notification/settings/audit/leave-balance/COF logic
      validators/              express-validator rule sets
      utils/                   date/time, attendance calculators, JWT, email
      jobs/                    COF expiry cron job
      seeds/                   seed:admin and seed:demo scripts
      app.js / server.js       Express app + entrypoint
    uploads/                   local file storage (profile photos, logos, attachments)
    .env.example
  client/                     React app
    src/
      api/                     one axios module per feature area
      components/              layouts (Sidebar/Header/AdminLayout/EmployeeLayout) + shared UI kit
      context/AuthContext.tsx
      pages/
        auth/                  Login, Register, Forgot/Reset Password
        shared/                Complete Profile, Notifications (used by both roles)
        admin/                 Dashboard, Employees, Attendance, Leaves, Holidays, COF, Reports, Settings, Profile
        employee/               Dashboard, Profile, Attendance, Apply Leave, My Leaves, Holidays, COF, Settings
      routes/ProtectedRoute.tsx
      types/                   shared TypeScript interfaces mirroring the backend models
    .env.example
  README.md                    (this file)
```

---

## 3. Prerequisites

- Node.js 18+
- A MongoDB database — either a free **MongoDB Atlas** cluster (recommended, works from anywhere)
  or a local `mongod` instance.

---

## 4. Installation & local development

### 4.1 Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGODB_URI to your Atlas connection string (or local mongodb://127.0.0.1:27017/ssm)
# set JWT_SECRET to a long random string
npm install
npm run seed:admin      # creates the initial Admin account (idempotent — safe to re-run)
npm run dev              # starts the API on http://localhost:5000
```

The initial Admin account uses the credentials in `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in
your `.env` (defaults are documented in `.env.example`). The password is bcrypt-hashed before it
ever touches the database, and `mustChangePassword` is set to `true` so the app can prompt for a
change after first login. **Change this password immediately after your first login** — the
initial credentials should never be treated as a long-term password.

Optional demo data (separate from the production Admin seed, safe to skip in production):

```bash
npm run seed:demo        # sample leave types, holidays, and one demo employee
```

### 4.2 Frontend

```bash
cd client
cp .env.example .env
# edit .env: set VITE_API_URL to your backend URL + /api, e.g. http://localhost:5000/api
npm install
npm run dev               # starts the app on http://localhost:5173
```

Open `http://localhost:5173`, register a new employee account (or sign in as the seeded Admin),
and you're running the full application against your own database.

---

## 5. Environment variables

### `server/.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Frontend origin, used for CORS + password-reset links |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Used only by `npm run seed:admin` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | Optional email delivery |
| `APP_TIMEZONE` | Business-logic timezone (default `Asia/Kolkata`) |
| `MAX_UPLOAD_MB` | Max upload size for photos/logos/attachments |

### `client/.env`

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL, including `/api` |

**Never commit real `.env` files.** Only `.env.example` files (with placeholder values) are
checked in, per the project's security requirements.

---

## 6. Authentication & security notes

- Passwords are hashed with bcrypt; the plaintext is never logged, stored, or returned by any API.
- JWTs are issued on login and can be sent either as an httpOnly cookie or a `Bearer` header — the
  frontend uses the header via `localStorage`, but the cookie path is also wired up server-side if
  you prefer to switch the client to cookie-only auth for extra XSS hardening.
- **Every Admin-only endpoint is protected by backend middleware** (`authorize('ADMIN')`), not just
  hidden in the UI. An Employee's JWT will get a `403` from any Admin route no matter what the
  frontend does.
- Forgot-password uses single-use, 30-minute expiring tokens (SHA-256 hashed at rest) and always
  returns the same generic response whether or not the email exists, so the API never confirms
  which emails are registered.
- **Development-safe email fallback**: if `SMTP_*` variables are not set, the API does not fail —
  it logs the email to the server console instead, and (only when `NODE_ENV !== 'production'`)
  returns the reset link / temporary password directly in the API response so the flow stays fully
  testable without email infrastructure. In production, configure SMTP or these fields are omitted
  and the generic "check your email" response is all that's returned.

---

## 7. Business logic decisions (documented per the "ambiguous requirement" rule)

A few requirements were intentionally underspecified in the original brief. Here's what was
implemented and why, so nothing is a silent guess:

- **Weekly off**: Sunday is treated as the single company-wide weekly off, used consistently for
  attendance dashboards, leave day-counting, and COF eligibility. If your company uses a different
  weekly-off day or a rotating schedule, this is centralized in `dateHelpers.isSunday` and the
  leave/COF services, so it's a small, well-contained change.
- **Half-day + late interaction**: an employee who is late but still completes a full day is marked
  `LATE` for visibility, not silently reclassified to `PRESENT` — Admin can see and correct this in
  Attendance Management.
- **Leave day counting**: excludes Sundays and (optionally) company holidays from the day count,
  configurable in Settings → Leave Rules. Half-day leave always counts as `0.5` regardless of these
  toggles.
- **Employee-editable professional fields**: employees can set their own department/designation/etc.
  *once*, the very first time they complete their profile (since nothing exists yet). After that,
  professional fields become Admin-controlled only, matching "Admin can view complete employee
  information" while still letting a brand-new employee get through onboarding without waiting on
  an Admin.
- **COF approval**: configurable via Settings → COF Rules (`requiresApproval`). When off, COF is
  auto-approved the moment the minimum Sunday hours are met; when on, it's created as
  `PENDING_APPROVAL` and Admins are notified.
- **Reports CSV export**: implemented for all four report types (Attendance, Leave, COF, Employee)
  via a `?format=csv` flag on the same endpoints used for the on-screen table, so there's a single
  source of truth for report data.

---

## 8. API overview

All routes are namespaced under `/api`. Full request/response contracts are in the controller
files (each one is short and readable); the high-level surface is:

```
/api/auth            register, login, logout, me, forgot-password, reset-password, change-password
/api/employees        self-service profile + Admin employee management (list/get/edit/status/reset-password)
/api/attendance       punch-in, punch-out, today, my, and Admin's full attendance management
/api/leaves           apply/my/cancel + Admin approve/reject/list, plus /types and /balance sub-resources
/api/holidays         list (all users) + Admin create/update/delete
/api/cof              my + Admin list/create/update (approve/adjust/cancel/expire)
/api/notifications    my notifications, mark-read, mark-all-read
/api/settings         company + office + leave + COF + notification settings (Admin write, all read)
/api/reports          attendance/leave/cof/employee reports, CSV via ?format=csv (Admin only)
/api/dashboard        /admin and /employee aggregated dashboard stats
/api/audit-logs       Admin-only audit trail of sensitive actions
```

(The dashboard and audit-log routes aren't in the original spec's API list — they were added
because the dashboards and audit trail described in the brief need *some* endpoint to source their
data from; this is called out explicitly here rather than silently expanding the API surface.)

---

## 9. Deployment

### Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow your deployment's IP (or `0.0.0.0/0` for simplicity, tightened
   later).
3. Copy the connection string into `MONGODB_URI` on your backend host.

### Backend — Render / Railway (or any Node host)
1. Point the service at the `server/` folder.
2. Build command: `npm install`. Start command: `npm start`.
3. Set all `server/.env.example` variables in the host's environment settings.
4. After the first deploy, run `npm run seed:admin` once (via a one-off job/shell) to create the
   initial Admin account.

### Frontend — Vercel
1. Point the project at the `client/` folder.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set `VITE_API_URL` to your deployed backend's `/api` URL.
4. Set `CLIENT_URL` on the **backend** to your deployed Vercel URL so CORS allows it.

### CORS
The backend's CORS is driven entirely by `CLIENT_URL` — one deployed frontend origin per backend
environment. For multiple frontend origins (e.g. staging + production), extend the `cors()` config
in `server/src/app.js` to accept an array.

---

## 10. Troubleshooting

- **"The database is temporarily unavailable"** on every request: check `MONGODB_URI` and that
  your IP is allow-listed in Atlas.
- **CORS errors in the browser console**: confirm `CLIENT_URL` on the backend exactly matches the
  frontend's origin (protocol + host + port, no trailing slash).
- **Forgot-password email never arrives**: if `SMTP_*` isn't configured, this is expected — check
  the backend console log (or the API response in non-production) for the reset link instead.
- **"Invalid email or password" right after seeding**: confirm you're using the exact
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from the `.env` file the seed script actually ran
  against.

---

## 11. What's included vs. natural next steps

Everything in the original feature list is implemented with real backend logic and no mocked
data. Two things are intentionally left as documented, easy extensions rather than over-built for
a first release:

- **Cloud file storage**: uploads (photos, logos, attachments) are stored on local disk under
  `server/uploads/`, exactly as the brief allowed for development ("Local uploads are acceptable
  for development, but structure it for cloud storage later"). The `middleware/upload.js` module is
  a single, isolated place to swap in S3/Cloudinary/etc. later.
- **Frontend bundle size**: the production build is a single JS bundle (~290KB gzipped). It works
  fine as-is; splitting routes with `React.lazy()` would trim the initial load further if this ever
  becomes a real project.
