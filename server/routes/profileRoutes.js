const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/', auth, profileController.getProfile);
router.put('/', auth, profileController.updateProfile);
router.post('/onboard', auth, profileController.onboard);
router.post('/fetch', auth, profileController.fetchProfile);
router.post('/analyze-style', auth, profileController.analyzeStyle);

module.exports = router;
