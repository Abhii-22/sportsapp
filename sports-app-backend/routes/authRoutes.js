const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpAndRegister, loginUser } = require('../controllers/authController');

router.post('/send-otp', sendOtp);
router.post('/register', verifyOtpAndRegister);
router.post('/login', loginUser);

module.exports = router;