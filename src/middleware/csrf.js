const { doubleCsrf } = require('csrf-csrf');

const isProd = process.env.NODE_ENV === 'production';

function getSecret(req) {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'dev-csrf-secret-change-me';
  return secret;
}

const csrf = doubleCsrf({
  getSecret,
  getSessionIdentifier: (req) => (req.session && req.session.id ? req.session.id : ''),
  cookieName: 'eventora.x-csrf-token',
  cookieOptions: {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  },
  getTokenFromRequest: (req) => req.get('x-csrf-token') || req.body?._csrf,
});

const doubleCsrfProtection = csrf.doubleCsrfProtection;
const generateToken = csrf.generateToken;

function csrfTokenRoute(req, res) {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
}

module.exports = { doubleCsrfProtection, csrfTokenRoute, generateToken };
