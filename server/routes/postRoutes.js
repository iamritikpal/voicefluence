const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || '.webm'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format. Use WebM, OGG, WAV, or MP3.'));
    }
  },
});

router.get('/', auth, postController.listPosts);
router.get('/:id', auth, postController.getPost);
router.post('/generate', auth, upload.single('audio'), postController.generatePost);
router.post('/regenerate', auth, postController.regeneratePost);

module.exports = router;
