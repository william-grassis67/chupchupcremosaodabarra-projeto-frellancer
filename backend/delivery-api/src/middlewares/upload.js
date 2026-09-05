const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../../uploads/products');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, extension)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'produto';
    callback(null, `${Date.now()}-${basename}${extension}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'imagem'));
    }
    return callback(null, true);
  },
});