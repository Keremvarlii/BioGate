const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/logs -> authMiddleware'den geçerse logController.getLogs çalışır
router.get('/', authMiddleware, logController.getLogs);

module.exports = router;