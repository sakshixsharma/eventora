const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

if (isProd && !SESSION_SECRET) {
  console.error('Missing required SESSION_SECRET in production.');
  process.exit(1);
}

const { pool, verifyDatabaseConnection } = require('./src/config/db');
const { requireAuth, requireRole } = require('./src/middleware/auth');
const { doubleCsrfProtection, csrfTokenRoute } = require('./src/middleware/csrf');
const { notFound, errorHandler } = require('./src/middleware/errors');

const authRoutes = require('./src/routes/auth');
const eventRoutes = require('./src/routes/events');
const registrationRoutes = require('./src/routes/registrations');
const attendanceRoutes = require('./src/routes/attendance');
const reportRoutes = require('./src/routes/reports');
const userRoutes = require('./src/routes/users');
const notificationRoutes = require('./src/routes/notifications');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "blob:"],
      "media-src": ["'self'", "blob:"],
      "worker-src": ["'self'", "blob:"],
      "frame-ancestors": ["'self'"],
      "object-src": ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: false }),
  name: 'eventora.sid',
  secret: SESSION_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.get('/api/csrf-token', csrfTokenRoute);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});
app.use('/api/auth/login', loginLimiter);

app.use('/api', (req, res, next) => {
  if (req.path === '/csrf-token') return next();
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  return doubleCsrfProtection(req, res, next);
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Health check database failure:', err.message);
    res.status(503).json({ status: 'error', error: 'Database connection failed' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', ok: true, db: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('Health check database failure:', err.message);
    res.status(503).json({ status: 'error', ok: false, db: false, error: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Role-guarded page directories BEFORE general static.
app.use('/admin', requireAuth, requireRole(['admin']), express.static(path.join(__dirname, 'public', 'admin'), { extensions: ['html'] }));
app.use('/organizer', requireAuth, requireRole(['organizer', 'admin']), express.static(path.join(__dirname, 'public', 'organizer'), { extensions: ['html'] }));
app.use('/student', requireAuth, requireRole(['student']), express.static(path.join(__dirname, 'public', 'student'), { extensions: ['html'] }));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  index: false, dotfiles: 'deny',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'none'; script-src 'none'");
  },
}));

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], index: 'index.html' }));

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await verifyDatabaseConnection();
  } catch (err) {
    console.error('Database connection failed during startup:', err.message);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EVENTORA running on http://0.0.0.0:${PORT}`);
  });
}

start();


