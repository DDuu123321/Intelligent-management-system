// src/routes/attendance.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAttendanceStats, listAttendanceRecords, checkinOrOut } = require('../controllers/attendanceController');
const router = express.Router();

router.get('/stats', getAttendanceStats);
router.get('/records', authenticateToken, listAttendanceRecords);
router.post('/checkin', authenticateToken, checkinOrOut);

module.exports = router;