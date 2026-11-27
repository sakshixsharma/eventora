function notFound(req, res, _next) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(404).send('Not found');
}

function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error(err);
  } else if (err && err.status >= 500) {
    console.error('Server error:', err.message);
  }

  const status = err.status || err.statusCode || 500;
  let message = err.message || 'Request failed';
  if (status >= 500 && isProd) message = 'Internal server error';
  if (err.code === 'EBADCSRFTOKEN' || err.code === 'InvalidCsrfToken') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ error: message, ...(err.details ? { details: err.details } : {}) });
  }
  return res.status(status).send(status >= 500 && isProd ? 'Internal server error' : message);
}

module.exports = { notFound, errorHandler };
