# EVENTORA ? College Event Management System

**Tagline:** Every Event. One Platform.  
**Project:** BCA Semester 5 Minor Project

EVENTORA is a full-stack college event management web application for discovering events, registering students, issuing digital QR passes, scanning attendance, and generating reports.

## Tech Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript (ES modules), Bootstrap 5, Three.js, GSAP, Chart.js, QRCode.js, html5-qrcode
- **Backend:** Node.js 20+, Express, pg, bcrypt, express-session, connect-pg-simple, helmet, express-rate-limit, express-validator, multer, csrf-csrf, dotenv, morgan
- **Database:** PostgreSQL (InsForge-hosted) accessed server-side only via `DATABASE_URL`

## Project Structure

```text
eventora/
  server.js
  package.json
  .env.example
  README.md
  scripts/
    migrate.js
    seed.js
  src/
    config/db.js
    middleware/{auth,csrf,upload,errors,assignment}.js
    routes/{auth,events,registrations,attendance,reports,users,notifications}.js
    services/{registration,attendance,reports}.js
    utils/{codes,validators,notify}.js
  database/
    schema.sql
    seed.sql
  public/
    index.html, login.html, signup.html
    admin/*.html
    organizer/*.html
    student/*.html
    assets/{css,js,img}
    uploads/
    vendor/
  tests/
    manual-checklist.md
    race-last-seat.js
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in InsForge PostgreSQL credentials. `DATABASE_URL` is required. Keep `.env` private.

3. **Apply schema and seed**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   These scripts connect using `DATABASE_URL` with SSL enabled (InsForge-compatible).

4. **Start app**
   ```bash
   npm start
   ```
   Open `http://localhost:3000`.

## Health Check

`GET /api/health` runs `SELECT 1` and returns DB connectivity status.

## Demo Logins

All seeded users use password: `Password@123`

| Role | Email | Notes |
|---|---|---|
| Admin | admin@eventora.edu | Full access |
| Organizer | organizer1@eventora.edu | Assigned to AI Hackathon, Web Dev Workshop, Code Sprint |
| Organizer | organizer2@eventora.edu | Assigned to Cultural Night, Football Cup, Cybersecurity Seminar |
| Student | student1@eventora.edu | BCA5001 |
| Student | student2@eventora.edu | BCA5002 |
| Student | student3@eventora.edu | BCA5003 |
| Student | student4@eventora.edu | BCA5004 |
| Student | student5@eventora.edu | BCA5005 |
| Student | student6@eventora.edu | BCA5006 |
| Student | student7@eventora.edu | BCA5007 |
| Student | student8@eventora.edu | BCA5008 |
| Student | student9@eventora.edu | BCA5009 |
| Student | student10@eventora.edu | BCA5010 |

## Key Business Rules Implemented

- **BR-1** duplicate registration blocked (DB unique + transaction check)
- **BR-2** full event shows/returns "Event full"
- **BR-3** deadline closes registration
- **BR-4** cancelled event blocks registration and notifies registered students
- **BR-5** cancellation frees seat (derived from Registered count)
- **BR-6** re-register reactivates same row with fresh QR token/code
- **BR-7** invalid QR returns "Invalid pass"
- **BR-8** duplicate scan returns "Already checked in" with original time
- **BR-9** role-protected routes/pages denied for unauthorized roles
- **BR-10** students can only access own pass (`user_id` checked, 403 otherwise)
- **BR-11** check-in window: 2 hours before start until end; admin override supported
- **BR-12** organizer can only scan/manage assigned events

## Security Notes

- Passwords hashed with bcrypt.
- Parameterized SQL queries only (`$1,$2,...`).
- CSRF token required on state-changing API requests (`x-csrf-token`).
- Session cookies: `httpOnly`, `sameSite=lax`, `secure` in production; session regenerated on login.
- Helmet CSP configured for required local/vendor sources.
- Login rate-limited.
- Poster uploads: JPG/PNG/WebP only, MIME+extension whitelist, max 2 MB, random filename, stored in `/public/uploads`.
- QR token contains no personal data; only random 64-char hex token.

## Scanner Demo (localhost)

1. Login as `organizer1@eventora.edu` or `admin@eventora.edu`.
2. Open **Scanner** page.
3. Select an event (organizer must be assigned; admin can select published events).
4. Allow camera permission. On localhost, browsers allow camera without HTTPS.
5. Scan a student's digital pass QR. Result banners: green success, amber duplicate, red invalid/rejected.
6. If camera is blocked/unavailable, use **Manual Check-in** with registration code or roll number.

## Tests

- Manual checklist: `tests/manual-checklist.md` (TC01?TC20)
- Race condition script: `node tests/race-last-seat.js` with `EVENT_ID=<id>` for an event having exactly 1 seat left.

## Notes

- No payments/email/waitlist added.
- Vendor libraries are stored locally in `public/vendor` for offline demo.
- `INSFORGE_API_KEY` is included in `.env.example` as placeholder; DB connection uses server-side PostgreSQL credentials only.
