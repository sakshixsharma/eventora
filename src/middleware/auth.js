function requireAuth(req, res, next) {
  const user = req.session && req.session.user;
  if (user) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

function requireRole(...roles) {
  const allowed = Array.isArray(roles[0]) ? roles[0] : roles;
  return (req, res, next) => {
    const user = req.session && req.session.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (!allowed.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
