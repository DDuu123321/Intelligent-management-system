// src/routes/departments-simple.js
console.log('🔧 Loading simple department routes...');
const express = require('express');
const router = express.Router();

// 简单的测试路由
router.get('/', (req, res) => {
  console.log('🔧 Department route hit!');
  res.json({
    success: true,
    message: '部门API正常工作',
    data: [
      { id: 1, name: '技术部', description: '负责技术开发' },
      { id: 2, name: '运营部', description: '负责日常运营' }
    ]
  });
});

console.log('🔧 Simple department routes loaded successfully');
module.exports = router;