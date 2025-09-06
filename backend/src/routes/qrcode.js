// src/routes/qrcode.js
const express = require('express');
const router = express.Router();
const qrcodeController = require('../controllers/qrcodeController');
const { authenticateToken } = require('../middleware/auth');

// 管理员路由（需要认证）
router.post('/', authenticateToken, qrcodeController.createQRCode);
router.get('/', authenticateToken, qrcodeController.getAllQRCodes);
router.put('/:id', authenticateToken, qrcodeController.updateQRCode);
router.delete('/:id', authenticateToken, qrcodeController.deleteQRCode);
router.get('/stats', authenticateToken, qrcodeController.getCheckinStats);

// 公开路由（员工签到用，无需认证）
router.get('/scan/:token', qrcodeController.getQRCodeByToken);
router.post('/checkin/:token', qrcodeController.checkin);

module.exports = router;