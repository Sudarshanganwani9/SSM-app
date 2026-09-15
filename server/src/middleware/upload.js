const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(subfolder) {
  const dir = path.join(UPLOAD_ROOT, subfolder);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
}

const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp'];
const DOC_TYPES = [...IMAGE_TYPES, '.pdf'];

function fileFilterFactory(allowedExts) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new ApiError(400, `Unsupported file type. Allowed: ${allowedExts.join(', ')}`));
    }
    cb(null, true);
  };
}

const maxBytes = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;

const uploadProfilePhoto = multer({
  storage: makeStorage('profile-photos'),
  fileFilter: fileFilterFactory(IMAGE_TYPES),
  limits: { fileSize: maxBytes },
});

const uploadCompanyLogo = multer({
  storage: makeStorage('company-logo'),
  fileFilter: fileFilterFactory(IMAGE_TYPES),
  limits: { fileSize: maxBytes },
});

const uploadLeaveAttachment = multer({
  storage: makeStorage('leave-attachments'),
  fileFilter: fileFilterFactory(DOC_TYPES),
  limits: { fileSize: maxBytes },
});

const uploadHolidayIcon = multer({
  storage: makeStorage('holiday-icons'),
  fileFilter: fileFilterFactory(IMAGE_TYPES),
  limits: { fileSize: maxBytes },
});

module.exports = {
  uploadProfilePhoto,
  uploadCompanyLogo,
  uploadLeaveAttachment,
  uploadHolidayIcon,
};
