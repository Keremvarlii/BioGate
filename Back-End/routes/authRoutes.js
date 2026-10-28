const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/admin-login
router.post('/admin-login', authController.adminLogin);

module.exports = router;