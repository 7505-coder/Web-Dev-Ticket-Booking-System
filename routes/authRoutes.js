const express = require('express');
const { registerUser, loginUser, loginAdmin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegisterPayload, validateLoginPayload } = require('../middleware/validators');

const router = express.Router();

router.post('/register', validateRegisterPayload, registerUser);
router.post('/login', validateLoginPayload, loginUser);
router.post('/admin-login', validateLoginPayload, loginAdmin);
router.get('/me', protect, getMe);

module.exports = router;
