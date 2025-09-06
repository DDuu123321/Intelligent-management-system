// src/routes/vehicles.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getVehicleStats, listVehicles, updateLocation, sendCommand } = require('../controllers/vehicleController');
const router = express.Router();

router.get('/stats', authenticateToken, getVehicleStats);
router.get('/list', authenticateToken, listVehicles);
router.post('/location', authenticateToken, updateLocation);
router.post('/command', authenticateToken, sendCommand);

module.exports = router;