You are a senior full-stack engineer. Build "EVENTORA – College Event Management System" (tagline: "Every Event. One Platform."), a BCA Semester 5 minor project. Deliver complete, runnable, commented code, file by file.

=== 1. STACK ===
Frontend: HTML5, CSS3, vanilla JavaScript (ES modules), Bootstrap 5, Three.js (3D), GSAP (animation), Chart.js, QRCode.js, html5-qrcode. No React/Vue. Keep local copies of all libraries in /public/vendor so the demo works offline.
Backend: Node.js 20+, Express, pg (node-postgres), bcrypt, express-session with connect-pg-simple, helmet, express-rate-limit, express-validator, multer, csrf protection (csrf-csrf or equivalent), dotenv, morgan.
Database: PostgreSQL hosted on InsForge. Connect ONLY from the server using DATABASE_URL from .env with SSL required (ssl: { rejectUnauthorized: false } if needed). Never expose DB credentials or the InsForge API key to the browser. Provide a .env.example with placeholders:
  DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
  PGHOST= PGPORT=5432 PGDATABASE= PGUSER= PGPASSWORD=
  INSFORGE_API_KEY=
  SESSION_SECRET=
  PORT=3000
Add .gitignore (.env, node_modules, uploads). Include a /api/health route that runs SELECT 1 to prove the DB connection.

=== 2. ROLES ===
Administrator, Event Organizer, Student. Only admins create/cancel events and manage users/organizers. Organizers edit, view registrations, scan and report ONLY for events assigned to them. Students see only published events and their own registrations/passes. Every protected route and API calls a central requireRole([...]) middleware; organizer routes also call assertAssigned(eventId).

=== 3. DATABASE (PostgreSQL, 3NF, FKs enforced) ===
Write database/schema.sql and database/seed.sql.
- Types: user_role('admin','organizer','student'), event_status('Draft','Published','Cancelled'), reg_status('Registered','Cancelled'), att_method('QR','Manual').
- users(user_id identity PK, full_name, email UNIQUE, password_hash, role, department, roll_number UNIQUE NULL, phone, is_active default true, created_at, updated_at)
- categories(category_id, category_name UNIQUE) seeded: Technical, Cultural, Sports, Workshops, Seminars, Competitions
- events(event_id, title, description, category_id FK, poster, event_date, start_time, end_time, venue, capacity, registration_deadline timestamptz, status default 'Draft', created_by FK, created_at, updated_at)
- organizer_events(id, organizer_id FK, event_id FK ON DELETE CASCADE, UNIQUE(organizer_id,event_id))
- registrations(registration_id, user_id FK, event_id FK, registration_code UNIQUE (e.g. EVT-2026-000123), qr_token CHAR(64) UNIQUE, registration_status default 'Registered', registered_at, cancelled_at, UNIQUE(user_id,event_id))
- attendance(attendance_id, registration_id UNIQUE FK, marked_by FK, marked_at, method att_method, note)
- notifications(notification_id, user_id FK, message, is_read default false, created_at)
- Indexes: events(event_date,status), registrations(event_id,registration_status), notifications(user_id,is_read).
- Do NOT store "Absent" rows: absent = Registered with no attendance row. Seats left = capacity - count(Registered).
- Seed: 1 admin, 2 organizers, 10 students, 8 events across categories (past, today, upcoming, one full, one past-deadline, one cancelled), sample registrations and attendance. Passwords hashed with bcrypt; list demo logins in README.

=== 4. BACKEND RULES (all server-side) ===
Registration (POST /api/events/:id/register) inside ONE transaction using a dedicated pool client:
 BEGIN; SELECT ... FROM events WHERE event_id=$1 FOR UPDATE; check status='Published' and now() < registration_deadline; count Registered rows and reject if >= capacity ("Event full"); check existing row for (user,event): if Registered -> reject (duplicate); if Cancelled and before deadline -> UPDATE same row to Registered, cancelled_at=NULL, NEW qr_token and code (old QR must stop working); else INSERT with registration_code and qr_token = crypto.randomBytes(32).toString('hex'); insert notification; COMMIT; on any error ROLLBACK. Two simultaneous requests for the last seat: only one succeeds.
Cancel registration: only before deadline; set Cancelled + cancelled_at; seat is freed automatically.
Cancel event: one transaction setting status='Cancelled' and notifying every Registered student.
Attendance (POST /api/attendance/verify, roles admin/organizer, CSRF protected), body {token, event_id}:
 1) find registration by qr_token; none -> status "invalid"
 2) must be Registered and belong to the selected event, else "rejected"
 3) organizer must be assigned to that event (BR-12)
 4) check-in window: from 2 hours before start until event end; admin may override with a flag (BR-11)
 5) INSERT INTO attendance ... ON CONFLICT (registration_id) DO NOTHING; if no row inserted -> "duplicate" and return original time (BR-8)
 6) return JSON {status: success|duplicate|invalid|rejected, message, student, roll, time, present_count}
 The QR holds only the token (no personal data). Manual check-in by registration code or roll number uses the same logic with method='Manual'. Corrections by staff are recorded (method/note).
Security: bcrypt hashing; parameterized queries ONLY ($1,$2); escape all output (never innerHTML with user data); CSRF token on every state-changing request; session regenerate on login, httpOnly + sameSite cookies; generic "invalid email or password" error; rate-limit login; posters: whitelist JPG/PNG/WebP by MIME and extension, max 2 MB, random filenames, served from a static folder with no script execution; helmet CSP allowing only the required script sources.
Also: profile edit and password change, pagination on list endpoints, CSV export (event-wise report: registered, present, absent, participation %), dashboard stats endpoint (total events, students, registrations, attendance, attendance rate, most popular events, registration trend), notifications endpoints (list, unread count, mark read).

=== 5. PAGES (responsive: phone, tablet, desktop) ===
Public: landing (hero, featured/upcoming events, categories, login and sign-up buttons, footer), login, sign-up (name, email, password, department, roll number, phone; inline validation; duplicate email/roll messages).
Student: dashboard (welcome, registered count, upcoming events, my passes, notifications), event list (search by name; filter by category and date; cards with seats left; pagination), event details (poster, description, schedule, venue, organizer, seats left, deadline, Register Now button that is disabled when closed/full/already registered), my registrations (status Registered/Cancelled/Attended with Cancel and View Pass), digital pass (college name, event, student, registration code, date, venue, status, QR; view, print via @media print, download as PNG/PDF), profile.
Organizer: dashboard (assigned events, registration counts, attendance shortcuts), my events (edit), registrations list, attendance scanner, event report.
Admin: dashboard (stat cards, Chart.js charts, recent registrations), event manager (create/edit/publish/cancel with confirmation, poster upload, assign organizers), user manager (add organizer, edit, deactivate with confirmation), reports (event-wise table, filters, CSV export), scanner.
Scanner page: event selector, html5-qrcode camera view, large colour-coded result banner readable from arm's length (green valid, amber duplicate, red invalid/rejected), manual check-in input, live present count. Keep manual check-in as fallback if camera is blocked (camera needs HTTPS or localhost).
Every form: labels, inline validation, success/error toast. Destructive actions need a confirm modal. Basic accessibility: labels, contrast, keyboard use.

=== 6. DESIGN SYSTEM ===
Apple-inspired, clean, blue and white. Primary #2563EB, text #111827, page bg #F3F4F6, cards #FFFFFF, success #16A34A, amber #F59E0B, danger #DC2626. Font Inter (fallback Poppins, sans-serif). Cards 16-20px radius, buttons 12px radius, soft shadows, rounded outline icons. Define all colours as CSS variables in one file; sidebar + top navbar on dashboards (sidebar collapses on phones). Support light mode first, optional dark mode toggle.

=== 7. 3D AND ANIMATION (must look impressive but stay fast) ===
- Landing hero: Three.js scene with a floating, slowly rotating 3D event ticket / QR-cube in brand blue with soft lighting, subtle particle field, and mouse-parallax camera movement. Lazy-load Three.js only on the landing and login/sign-up pages.
- 3D tilt (perspective transform) on event cards on hover; staggered scroll-reveal animations (GSAP ScrollTrigger or IntersectionObserver).
- Digital pass: CSS 3D flip card (front: pass details, back: large QR), with a light-sweep shine effect.
- Scanner: animated scan-line overlay and a pop/shake animation on result banners.
- Dashboards: animated counters for stat cards, Chart.js charts animating in, smooth page transitions.
- Performance and accessibility: cap devicePixelRatio at 2, pause rendering when the tab is hidden, dispose Three.js objects on page leave, respect prefers-reduced-motion (disable 3D motion and show a static image), provide a graceful fallback if WebGL is unavailable. Keep pages under 2 seconds on localhost.

=== 8. BUSINESS RULES TO COVER ===
BR-1 no double registration; BR-2 full shows "Event full"; BR-3 deadline closes registration; BR-4 cancelled event blocks registration and notifies participants; BR-5 cancellation frees the seat; BR-6 re-register reactivates the same row with a fresh token; BR-7 invalid QR shows "Invalid pass"; BR-8 second scan shows "Already checked in" with original time; BR-9 non-admin on admin page is denied; BR-10 student cannot open another student's pass (query by user_id, return 403); BR-11 check-in window; BR-12 organizer can only scan for assigned events.

=== 9. SUGGESTED STRUCTURE ===
eventora/
 server.js, package.json, .env.example, README.md
 src/config/db.js, src/middleware/{auth,csrf,upload,errors}.js
 src/routes/{auth,events,registrations,attendance,reports,users,notifications}.js
 src/services/{registration,attendance,reports}.js, src/utils/{codes,validators}.js
 database/schema.sql, database/seed.sql
 public/{index.html, login.html, signup.html}, public/{admin,organizer,student}/*.html
 public/assets/{css,js,img}, public/uploads, public/vendor
Shared JS modules: api.js (fetch wrapper that adds the CSRF header and handles 401/403), ui.js (toasts, modals), three-scene.js, animations.js, scanner.js, pass.js, charts.js.

=== 10. ACCEPTANCE TESTS (write a tests/ folder or a manual checklist with expected results) ===
TC01 valid student login; TC02 wrong password gives a generic error; TC03 admin opens event form; TC04 student opening an admin URL is denied; TC05 register for an available event creates a pass; TC06 duplicate blocked; TC07 after deadline blocked; TC08 full blocked; TC09 valid QR records attendance; TC10 same QR again is rejected as duplicate; TC11 invalid QR gives a warning; TC12 CSV export is correct; TC13 two students racing for the last seat: only one succeeds (include a script that fires parallel requests); TC14 cancel then re-register: new token works, old token rejected; TC15 cancelling an event stops registrations and notifies participants; TC16 organizer on unassigned event is denied; TC17 non-image poster rejected; TC18 missing CSRF token rejected; TC19 student opening another's pass denied; TC20 phone-width layout usable.

=== 11. OUTPUT INSTRUCTIONS ===
Build in this order: database + seed -> server + auth/roles -> events -> registration -> pass -> scanner/attendance -> reports/charts -> notifications -> 3D polish. Do not add extras (email, payments, waitlist) until the registration-to-attendance flow works end to end. Output every file in full with a path header, no placeholders or "...rest of code". End with: install and run steps (npm install, node database/migrate script to apply schema and seed to InsForge, npm start), demo login list, and a short note on how to demo the scanner on localhost.