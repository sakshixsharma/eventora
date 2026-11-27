const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
const allowed = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = allowed.get(file.mimetype) || '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!allowed.has(file.mimetype)) {
    const err = new Error('Only jpeg, png, and webp images are allowed');
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { upload };
