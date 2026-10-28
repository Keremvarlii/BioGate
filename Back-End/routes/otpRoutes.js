const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// POST /api/otp/send - Kod gönder
router.post('/send', otpController.sendOtp);

// POST /api/otp/verify - Kodu doğrula
router.post('/verify', otpController.verifyOtp);

module.exports = router;