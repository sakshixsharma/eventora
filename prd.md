EVENTORA – PRD and System Architecture
College Event Management System (CEMS) · BCA Semester 5 Minor Project · Version 1.1
Every Event. One Platform.
Part A – Product Requirements Document
1. Overview
EVENTORA is a responsive web platform that digitizes the whole lifecycle of a college event: creation, publishing, student registration, digital pass issuance, QR-based attendance and post-event reporting. It replaces paper forms, WhatsApp announcements and manual attendance sheets with one centralized system for three roles: Administrator, Event Organizer and Student.
Item
Detail
Project type
Full-stack web application
Tech stack
HTML5, CSS3, JavaScript, Bootstrap 5, PHP 8+, MySQL (InnoDB), XAMPP
Libraries
Chart.js, QRCode.js, html5-qrcode
Environment
Localhost (XAMPP) for demo; optional online hosting
Readers
Developer, project guide, faculty evaluators
2. Problem Statement
• Event information is scattered across notice boards, posters and chat groups.
• Manual registration causes duplicates and over-booking.
• Paper passes can be forged, lost or reused.
• Attendance is taken on paper and re-typed later, causing errors and delay.
• Organizers cannot quickly see registrations, attendance or participation rates.
3. Goals, Non-Goals, Success Metrics
Goals
1.  One place where all college events are listed and discoverable.
2.  Online registration with instant confirmation and a digital pass.
3.  Zero duplicate registrations, zero over-capacity registrations, zero duplicate check-ins.
4.  Fast entry and attendance through QR scanning with server-side verification.
5.  Accurate registration, attendance and absentee reports for admins and organizers.
6.  A demo-ready, secure, well-documented project you can defend confidently in the viva.
Non-goals (v1.0): online payments, native mobile apps, email/SMS delivery, waitlists, calendar sync, AI recommendations, certificates, feedback forms.
Success metrics
Metric
Target
All Must requirements working end to end
100%
Test cases TC01–TC20 passing
20 / 20
Possible duplicate registrations
0
Registrations beyond capacity (even with simultaneous requests)
0
A QR pass accepted twice
0
Scan-to-result time on localhost
Under 2 seconds
Usable on phone, tablet and desktop widths
Yes
Note: the original blueprint said "12 core test cases" in one place and TC01–TC20 in another. This version standardizes on 20.
4. Users and Permissions
Role
Who
Primary needs
Administrator
Staff / faculty coordinator
Control users, events, organizers, reports
Event Organizer
Faculty or student coordinator
Monitor registrations and run check-in for assigned events
Student
Any enrolled student
Find events, register, hold a pass, see history
Capability
Admin
Organizer
Student
Log in
Yes
Yes
Yes
Manage users and organizers
Yes
No
No
Create events
Yes
No
No
Edit events
All
Assigned only
No
Cancel / delete events
Yes
No
No
Assign organizers
Yes
No
No
View registrations
All
Assigned events
Own only
Mark attendance (scan / manual)
All
Assigned events
No
View reports
All
Assigned events
No
View / download pass
–
–
Own only
Decision: only admins create events; organizers edit events assigned to them. This is simpler to build and easier to defend in the viva.
5. Scope
In scope (Must for submission): three roles with role-based dashboards; event create/edit/publish/cancel with poster upload; listing, search and category filter; registration with capacity, deadline and duplicate checks; unique registration code and QR token; digital pass (view, print, download); QR scanner plus manual check-in; reports with CSV export; in-app notifications; Chart.js dashboard charts.
Optional (only after the core works): email notifications, PDF passes/reports, live attendance counters, advanced analytics, calendar integration, waitlist.
6. Functional Requirements
Priority: Must = required for submission, Should = strongly recommended, Could = optional.
M1 – Authentication and User Management
ID
Requirement
Priority
FR-01
Students self-register with name, email, password, department, roll number, phone
Must
FR-02
All roles log in with email + password; logout destroys the session
Must
FR-03
Passwords stored hashed; never stored or shown in plain text
Must
FR-04
After login, route users to their role's dashboard
Must
FR-05
Every protected page and action re-checks role on the server
Must
FR-06
Admin creates organizer accounts; views, edits, deactivates users
Must
FR-07
Users view/edit own profile and change password
Should
Acceptance: duplicate email or roll number rejected with a clear message; wrong password shows a generic error; a student opening any admin or organizer URL is denied.
M2 – Event Management
ID
Requirement
Priority
FR-08
Admin creates event: name, description, category, poster, date, start/end time, venue, capacity, registration deadline
Must
FR-09
Admin edits any event; assigned organizers edit their events
Must
FR-10
Status Draft / Published / Cancelled; only Published visible to students
Must
FR-11
Admin assigns one or more organizers to an event
Must
FR-12
Poster validated for type (JPG, PNG, WebP), size (max 2 MB) and renamed on upload
Must
FR-13
Students search by name and filter by category and date
Must
FR-14
Cancelling an event stops new registrations and notifies registered students
Must
Seed categories: Technical, Cultural, Sports, Workshops, Seminars, Competitions.
M3 – Student Registration
ID
Requirement
Priority
FR-15
Event page shows poster, description, schedule, venue, organizer, seats left, deadline
Must
FR-16
Register button disabled when closed, full, or already registered
Must
FR-17
Registration runs in a DB transaction with a safe capacity check
Must
FR-18
Student can cancel before the deadline; the seat is released
Must
FR-19
Student sees all registrations with status (Registered, Cancelled, Attended)
Must
M4 – Digital Event Pass
ID
Requirement
Priority
FR-20
Unique registration code, e.g. EVT-2026-000123
Must
FR-21
Random unguessable QR token (at least 32 hex chars, cryptographic source)
Must
FR-22
Pass shows college name, event, student, code, date, venue, status, QR
Must
FR-23
QR encodes only the token, never personal data
Must
FR-24
Student can open, print or download only their own pass
Must
M5 – Attendance Management
ID
Requirement
Priority
FR-25
Organizer/admin opens browser QR scanner (html5-qrcode) after selecting an event
Must
FR-26
Server verifies the token is active and belongs to the selected event
Must
FR-27
First valid scan records attendance with timestamp and staff ID
Must
FR-28
Second scan shows "Already checked in" with the original time
Must
FR-29
Invalid, cancelled or wrong-event token shows a clear rejection
Must
FR-30
Manual check-in by registration code or roll number as fallback
Must
FR-31
Authorized staff can correct attendance; every correction is recorded
Should
M6 – Reports and Analytics
ID
Requirement
Priority
FR-32
Admin dashboard: total events, students, registrations, attendance, attendance rate
Must
FR-33
Event-wise report: registered, present, absent, participation %
Must
FR-34
Most popular events and registration trend
Should
FR-35
Reports export to CSV
Should
FR-36
Charts use Chart.js
Should
M7 – Notifications (in-app)
ID
Requirement
Priority
FR-37
Notify students on registration, cancellation and event changes
Should
FR-38
Unread count and mark-as-read
Should
FR-39
Email notifications
Could
7. Business Rules
ID
Situation
System behavior
BR-1
Student registers twice
Reject; one active registration per student per event
BR-2
Capacity full
Disable registration; show "Event full"
BR-3
Deadline passed
Close registration
BR-4
Event cancelled
Block new registrations; notify participants
BR-5
Student cancels
Mark Cancelled; free the seat
BR-6
Re-register after cancelling (before deadline)
Reactivate the same row; issue a fresh QR token
BR-7
Invalid QR scanned
Show "Invalid pass"
BR-8
QR scanned twice
Show "Already checked in"
BR-9
Non-admin opens an admin page
Deny access
BR-10
Student opens another student's pass
Deny access
BR-11
Check-in outside the window (2 hours before start until end time)
Reject; admin may override
BR-12
Organizer scans a pass for an unassigned event
Reject
8. Non-Functional Requirements
Area
Requirement
Security
Hashed passwords, prepared statements, output escaping, CSRF tokens, secure sessions
Performance
Pages load under 2 seconds on localhost; list pages paginate
Usability
First-time student registers in under 1 minute without help
Reliability
Registration and attendance stay consistent under simultaneous requests
Compatibility
Latest Chrome and Edge; mobile browsers for pass display and scanning
Responsiveness
Works at phone, tablet and desktop widths
Maintainability
Separate config, includes, role folders, assets; consistent naming; code comments
Scalability
Indexed schema supports many more events and users
9. UX Requirements
Design system: clean, modern, Apple-inspired; primary royal blue #2563EB; text #111827; page background #F3F4F6; cards #FFFFFF; success #16A34A; font Inter (fallback Poppins, sans-serif); card radius 16–20px; button radius 12px; sidebar plus top navbar on dashboards.
Screens: landing page; login and sign-up; student dashboard; event list; event details; my registrations; digital pass; admin dashboard; event manager; user manager; organizer dashboard; attendance scanner (green valid, amber duplicate, red invalid, manual search, live present count); reports.
UX rules: inline validation and success/error messages on every form; confirmation for destructive actions; large color-coded scanner results readable from arm's length; mobile- and print-optimized pass; labels, contrast and keyboard usability.
10. Key User Flows
1.  Registration: Login → browse events → open event → Register → checks (open, seats, duplicate) → saved → pass generated → pass displayed + notification created.
2.  Check-in: Organizer logs in → opens scanner, selects event → student shows pass → scan → server verifies → result banner → attendance saved with time and staff ID.
3.  Reporting: Admin opens Reports → selects event → views registered, present, absent, % → exports CSV.
11. Test Cases and Definition of Done
ID
Action
Expected result
TC01
Valid student login
Student dashboard opens
TC02
Wrong password
Generic error, no login
TC03
Admin opens event creation
Form opens
TC04
Student opens an admin URL
Access denied
TC05
Register for an available event
Success; pass created
TC06
Register twice
Duplicate blocked
TC07
Register after deadline
Blocked
TC08
Register when full
Blocked
TC09
Scan valid QR
Attendance recorded
TC10
Scan same QR again
Duplicate rejected
TC11
Scan invalid QR
Invalid pass warning
TC12
Export event report
CSV downloads with correct data
TC13
Two students take the last seat simultaneously
Only one succeeds
TC14
Cancel then re-register
Seat released then reissued; new token works, old token rejected
TC15
Cancel an event
Registrations stop; participants notified
TC16
Organizer opens an unassigned event
Denied
TC17
Upload non-image as poster
Rejected
TC18
Submit form without valid CSRF token
Rejected
TC19
Student opens another student's pass
Denied
TC20
View pages at phone width
Layout usable
Definition of Done: all Must requirements implemented; TC01–TC20 passed and recorded; no known security gaps; seeded demo data loaded; all deliverables complete.
12. Milestones (4 weeks)
Build order: database + seed data → auth and roles → events → registration → pass → scanner → reports → notifications → polish. No enhancements until registration-to-attendance works end to end.
Week
Focus
Deliverables
1
Planning and frontend
Final requirements, schema, XAMPP + Git setup, landing, login/sign-up, dashboard layouts
2
Backend and database
PHP–MySQL connection, auth, role access, event CRUD, registration with capacity and duplicate checks
3
QR and attendance
Registration codes, QR generation, pass, scanner, attendance records, reports and charts
4
Testing and submission
Full test pass, security review, responsive fixes, screenshots, report, PPT, viva prep
Submission package: source code; SQL export with demo data; project report (40–60 pages); presentation (10–15 slides); ER, DFD 0/1, use case, class, activity diagrams and flowchart; testing report; screenshots; user manual.
13. Risks and Mitigations
Risk
Mitigation
Scope creep
Freeze scope to Section 5 until all Must items pass
Camera blocked on non-HTTPS
Demo on localhost; keep manual check-in; test setup beforehand
Over-booking from simultaneous requests
Transactions with row locking plus DB constraints
Weak role checks
Central require_role() helper on every protected page
Demo-day failure
Seeded data, SQL backup, offline copies of libraries, rehearsed script
Can't explain code in viva
Build in phases, comment code, keep a one-page architecture summary
14. Decisions (defaults used)
Decision
Default
Application name
EVENTORA
UI style
Apple-inspired, blue and white
Scope
Complete: 3 roles, QR passes and scanning
Check-in window
2 hours before start until event end
Poster size limit
2 MB
Future enhancements: AI recommendations, Android app on the same backend, email/SMS, auto certificates, feedback and ratings, payments, department/year analytics, waitlist with auto-promotion, calendar integration.
Part B – System Architecture
15. Architectural Style
EVENTORA is a classic three-tier, server-rendered application. PHP pages render HTML on the server; JavaScript is used only for the scanner, QR generation, charts and small UI behaviors. Keeping it server-rendered is deliberate: fewer moving parts, easier to demo on XAMPP, easier to explain.
┌──────────────────────────── Browser ─────────────────────────────┐
│ HTML5 · CSS3 · Bootstrap 5 · JS · Chart.js · QRCode.js ·        │
│ html5-qrcode (camera)                                           │
└───────────────┬─────────────────────────────────▲───────────────┘
                │ HTTP (forms, fetch/JSON)        │ HTML / JSON
┌───────────────▼─────────────────────────────────┴───────────────┐
│ Application tier – PHP 8+ (Apache, XAMPP)                       │
│  includes/auth.php      sessions, require_role(), CSRF          │
│  includes/functions.php validation, escaping, code/token gen    │
│  role folders           admin/ organizer/ student/ attendance/  │
└───────────────┬─────────────────────────────────────────────────┘
                │ PDO prepared statements / transactions
┌───────────────▼─────────────────────────────────────────────────┐
│ Data tier – MySQL (InnoDB, utf8mb4, FKs, unique constraints)    │
│  users · categories · events · organizer_events ·               │
│  registrations · attendance · notifications                     │
└─────────────────────────────────────────────────────────────────┘
Core principle: the browser is never trusted. Roles, capacity, deadlines, check-in windows and QR validity are all enforced on the server and backed by database constraints.
16. Component Breakdown
Component
Responsibility
config/database.php
PDO connection (exceptions on, emulated prepares off, utf8mb4). Credentials live here only.
includes/auth.php
start_secure_session(), login_user(), require_login(), require_role(['admin']), current_user()
includes/functions.php
e() (htmlspecialchars), csrf_token(), csrf_verify(), generate_reg_code(), generate_qr_token(), flash(), upload_poster(), notify()
includes/header, navbar, footer
Shared layout; navbar changes by role; unread notification badge
admin/, organizer/, student/
Role-specific pages; each begins with require_role()
attendance/scan.php
Scanner UI (event selector, camera, result banner, manual search)
attendance/verify.php
JSON endpoint: verifies token and records attendance
assets/uploads/
Posters; .htaccess blocks script execution
Folder structure
college-event-management/
├── index.php  login.php  register.php  logout.php
├── config/database.php
├── includes/        header.php navbar.php footer.php auth.php functions.php
├── admin/           dashboard events add-event edit-event users organizers reports
├── organizer/       dashboard my-events registrations attendance
├── student/         dashboard events event-details my-registrations my-passes profile
├── attendance/      scan.php verify.php
├── assets/          css js images uploads
├── vendor/          (offline copies of Bootstrap, Chart.js, QRCode.js, html5-qrcode)
└── database/college_event_management.sql
17. Database Design
Target 3NF, InnoDB, utf8mb4, foreign keys enforced. Refinements over the blueprint are included (category FK, ENUM statuses, cancelled_at, no stored "Absent" rows, attendance.method, indexes).
CREATE DATABASE college_event_management CHARACTER SET utf8mb4;
USE college_event_management;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','organizer','student') NOT NULL,
  department VARCHAR(80),
  roll_number VARCHAR(30) UNIQUE,          -- NULL for staff
  phone VARCHAR(15),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  poster VARCHAR(255),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(150) NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  registration_deadline DATETIME NOT NULL,
  status ENUM('Draft','Published','Cancelled') NOT NULL DEFAULT 'Draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FOREIGN KEY (created_by)  REFERENCES users(user_id),
  INDEX idx_events_date_status (event_date, status)
) ENGINE=InnoDB;

CREATE TABLE organizer_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,
  event_id INT NOT NULL,
  UNIQUE (organizer_id, event_id),
  FOREIGN KEY (organizer_id) REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_code VARCHAR(30) NOT NULL UNIQUE,
  qr_token CHAR(64) NOT NULL UNIQUE,
  registration_status ENUM('Registered','Cancelled') NOT NULL DEFAULT 'Registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  UNIQUE (user_id, event_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  INDEX idx_reg_event_status (event_id, registration_status)
) ENGINE=InnoDB;

CREATE TABLE attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,      -- blocks duplicate check-ins
  marked_by INT NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  method ENUM('QR','Manual') NOT NULL,
  note VARCHAR(255),
  FOREIGN KEY (registration_id) REFERENCES registrations(registration_id),
  FOREIGN KEY (marked_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;
Relationships: one user creates many events; one category has many events; events and organizers are many-to-many via organizer_events; one student has many registrations and one event has many registrations; one registration has at most one attendance record; one user has many notifications.
Derived values (never stored): seats left = capacity − count of Registered rows; absent = Registered with no attendance row; "Attended" status = Registered with an attendance row.
18. Key Server-Side Flows
18.1 Registration (single transaction)
$pdo->beginTransaction();
try {
  // 1. Lock the event row so concurrent requests queue up
  $ev = $pdo->prepare("SELECT capacity, status, registration_deadline
                        FROM events WHERE event_id = ? FOR UPDATE");
  $ev->execute([$eventId]);  $event = $ev->fetch();

  // 2. Published and before the deadline?
  if (!$event || $event['status'] !== 'Published'
      || new DateTime() > new DateTime($event['registration_deadline']))
      throw new RuleException('Registration closed');

  // 3. Capacity check
  $c = $pdo->prepare("SELECT COUNT(*) FROM registrations
                      WHERE event_id = ? AND registration_status = 'Registered'");
  $c->execute([$eventId]);
  if ($c->fetchColumn() >= $event['capacity']) throw new RuleException('Event full');

  // 4. Existing row for this student?
  $x = $pdo->prepare("SELECT registration_id, registration_status FROM registrations
                      WHERE user_id = ? AND event_id = ?");
  $x->execute([$userId, $eventId]);  $row = $x->fetch();

  $code  = generate_reg_code($pdo);     // EVT-2026-000123
  $token = bin2hex(random_bytes(32));   // 64 hex chars

  if ($row && $row['registration_status'] === 'Registered')
      throw new RuleException('Already registered');      // BR-1
  if ($row) {   // BR-6: reactivate, fresh token invalidates the old QR
      $pdo->prepare("UPDATE registrations SET registration_status='Registered',
                      cancelled_at=NULL, qr_token=?, registration_code=? WHERE registration_id=?")
          ->execute([$token, $code, $row['registration_id']]);
  } else {
      $pdo->prepare("INSERT INTO registrations (user_id,event_id,registration_code,qr_token)
                      VALUES (?,?,?,?)")->execute([$userId,$eventId,$code,$token]);
  }
  notify($pdo, $userId, 'Registration confirmed');
  $pdo->commit();
} catch (Throwable $e) { $pdo->rollBack(); /* show friendly message */ }
Because the event row is locked with FOR UPDATE, two students taking the last seat are serialized: the second sees the updated count and is rejected (TC13). The unique (user_id, event_id) key is a second line of defense.
18.2 Attendance verification (attendance/verify.php)
1.  require_role(['admin','organizer']) and CSRF check on the POST.
2.  Receive token and event_id from the scanner (JSON via fetch).
3.  Look up the registration by qr_token joined with its event; none found → invalid.
4.  Check registration_status = 'Registered' and registration.event_id = selected event_id, else reject (BR-7, BR-12 wrong event).
5.  If the user is an organizer, confirm a row exists in organizer_events for this event (BR-12).
6.  Check the check-in window: event start minus 2 hours to event end; admin may override (BR-11).
7.  INSERT INTO attendance ... . A duplicate-key error (SQLSTATE 23000) means already checked in; fetch and return the original time (BR-8).
8.  Return JSON:
{ "status": "success | duplicate | invalid | rejected",
  "message": "Checked in",
  "student": "Asha Verma", "roll": "BCA2301",
  "time": "10:42 AM", "present_count": 57 }
The scanner maps success to a green banner, duplicate to amber, and invalid/rejected to red. The QR is never proof of attendance; only the server's check is.
18.3 Event cancellation
In one transaction: set events.status = 'Cancelled'; insert a notification for every user with a Registered row; commit. Registration checks already block non-Published events (BR-4).
18.4 Student cancellation
Allowed only before the deadline: set registration_status = 'Cancelled', cancelled_at = NOW(). The seat is freed automatically because seats left is derived. The old QR token fails verification (status is not Registered).
19. Security Architecture
Threat
Control in the architecture
Password theft
password_hash() / password_verify()
SQL injection
PDO prepared statements only, no string-built queries
XSS
e() wrapper around htmlspecialchars() on every output
CSRF
Per-session token in a hidden field on every state-changing form; also sent as a header by the scanner
Session fixation
session_regenerate_id(true) after login; HttpOnly and SameSite cookies
Privilege escalation
require_role() at the top of every protected page and action endpoint
IDOR (opening another student's pass)
Queries include WHERE user_id = :current_user; mismatch returns 403
QR forgery or guessing
256-bit random_bytes() token; validated server-side; contains no personal data
Malicious uploads
Extension and MIME whitelist, 2 MB limit, random file names, .htaccess disabling PHP execution in uploads
Duplicate records
DB unique constraints in addition to application checks
Credential exposure
DB credentials only in config/; keep out of public repositories
Brute-force login (optional)
Count failed attempts per account/IP and apply a short lockout
Authorization pattern (every protected page):
require_once '../includes/auth.php';
require_role(['admin']);          // redirects or 403 if role does not match
Organizer pages additionally call assert_assigned($eventId), which checks organizer_events.
20. Request Lifecycle and Navigation
1.  Browser requests a page (e.g. student/event-details.php?id=7).
2.  Page loads config/database.php and includes/auth.php; the session starts and require_role(['student']) runs.
3.  Page runs prepared queries and builds the view with escaped output.
4.  Forms POST back to the same page or an action file with a CSRF token; the server validates, writes inside a transaction where needed, then redirects (Post/Redirect/Get) with a flash message.
5.  Only the scanner, notification polling and chart data use fetch() returning JSON.
Role routing after login: admin → admin/dashboard.php; organizer → organizer/dashboard.php; student → student/dashboard.php.
21. Frontend Architecture
• Layout: Bootstrap 5 grid; shared header, navbar and footer; sidebar on dashboards that collapses on phones.
• Theming: CSS variables for the design tokens in Section 9 so the whole palette lives in one file (assets/css/style.css).
• Pass page: QRCode.js renders the token client-side; print stylesheet (@media print) hides navigation and shows only the card.
• Scanner page: html5-qrcode starts the camera after an event is selected; on decode it pauses scanning, posts the token, shows the banner, then resumes after about 2 seconds. A manual input (registration code or roll number) calls the same endpoint.
• Dashboard charts: Chart.js reads JSON from a small reports endpoint (registrations per day, event-wise participation).
• Offline resilience: keep local copies of all libraries in vendor/ so the demo does not depend on a CDN.
22. Deployment and Environment
Item
Setup
Web server
Apache via XAMPP, project in htdocs/college-event-management
PHP
8.0 or higher with pdo_mysql, gd/fileinfo enabled
Database
MySQL/MariaDB; import database/college_event_management.sql (schema, categories, demo admin, organizers, students, events)
Browser
Chrome or Edge; camera works on http://localhost
Phone demo
Needs HTTPS (local tunnel) for camera, or scan from the laptop webcam; manual check-in is always the fallback
Backup
SQL dump and a zipped project copy before demo day
23. Performance and Scalability Notes
• Index events(event_date, status), registrations(event_id, registration_status) and notifications(user_id, is_read) as defined above.
• Paginate event lists, registration lists and reports.
• Compute seats left with a COUNT on the indexed column rather than a stored counter, which avoids drift; the row lock keeps it safe.
• The design supports an Android app later because the verify and report logic can be exposed as JSON endpoints on the same database.
24. Suggested Diagram Set (for the report)
Diagram
What to show
ER diagram
The seven tables in Section 17 with cardinalities
DFD level 0
Admin, Organizer, Student ↔ EVENTORA ↔ database
DFD level 1
Auth, Event Mgmt, Registration, Pass, Attendance, Reports, Notifications
Use case
Actors and capabilities from the permission matrix
Class diagram
User, Event, Category, Registration, Attendance, Notification
Activity diagrams
Registration flow and check-in flow (Sections 18.1 and 18.2)
Flowchart
Login and role routing
25. Next Step
Start Phase 1: create the database, constraints, indexes and seed data from Section 17, then build authentication with require_role() and the three role dashboards. Tell me if you want any default in Section 14 changed (for example a college-specific name, a different check-in window or a larger poster limit)