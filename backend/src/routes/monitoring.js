// src/routes/monitoring.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getMonitoringStats, listCameras, listAlerts, resolveAlert } = require('../controllers/monitoringController');
const router = express.Router();

router.get('/stats', authenticateToken, getMonitoringStats);
router.get('/cameras', authenticateToken, listCameras);
router.get('/alerts', authenticateToken, listAlerts);
router.post('/alerts/:id/resolve', authenticateToken, resolveAlert);

module.exports = router;