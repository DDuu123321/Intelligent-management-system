// server.js (完全修复版本)
require('dotenv').config();

// 🔧 环境变量验证和错误恢复机制
console.log('🔧 环境变量配置验证:');
console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   API_PREFIX:', process.env.API_PREFIX);

// 如果CORS配置丢失，自动重新配置
if (!process.env.CORS_ORIGIN) {
  console.warn('⚠️ CORS_ORIGIN未设置，使用默认值');
  process.env.CORS_ORIGIN = 'http://localhost:5173';
}

// 强制设置关键环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 启动前安全校验
function validateEnvironment() {
  const required = [
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('Please set these variables in .env file or through environment variables.');
    console.error('Example: JWT_SECRET=your-secret-key-at-least-32-characters');
    process.exit(1);
  }
  
  // 验证 JWT_SECRET 强度
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET length insufficient, at least 32 characters required for security');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// 立即执行环境校验
validateEnvironment();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./src/config/config');
const { rateLimiter, httpsRedirect, securityHeaders, sanitizeInput } = require('./src/middleware/security');
const logger = require('./src/utils/logger');
// 控制台管理（生产环境自动清理console.log）
require('./src/utils/consoleOverride');

// 先导入数据库模型
const { User, Vehicle, Camera, Employee, CheckIn, Worksite } = require('./src/models');

// 导入认证中间件
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const server = http.createServer(app);

// 🔧 增强的CORS安全配置
const corsOptions = {
  origin: function (origin, callback) {
    // 从环境变量获取允许的域名列表
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
      ['http://localhost:5173'];

    // 开发环境允许没有origin的请求（如Postman、移动应用）
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }

    // 检查origin是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 开发环境下提供更宽松的策略，生产环境严格限制
      if (process.env.NODE_ENV === 'development') {
        // 记录未知来源但仍允许（仅开发环境）
        logger.debug('CORS: Unknown origin allowed in development', { origin });
        callback(null, true);
      } else {
        // 生产环境严格拒绝
        logger.warn('CORS: Origin rejected', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS policy'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-HTTP-Method-Override',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: process.env.NODE_ENV === 'production' ? 86400 : 3600, // 生产环境缓存24小时，开发环境1小时
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// 开发环境显示CORS配置概要
if (process.env.NODE_ENV === 'development') {
  logger.info('CORS配置已加载', { 
    allowedOrigins: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: corsOptions.credentials
  });
}

const io = socketIo(server, {
  cors: corsOptions
});

const PORT = config.port;

// WebSocket 连接处理
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
  
  // 加入房间用于特定事件
  socket.on('join', (room) => {
    socket.join(room);
    logger.info('Client joined room', { socketId: socket.id, room });
  });
});

// 导出 io 实例供其他模块使用
global.io = io;

// 安全中间件
app.use(httpsRedirect);
app.use(securityHeaders);
app.use(rateLimiter);

// CORS和JSON解析中间件 - 确保正确顺序
console.log('🔧 应用CORS中间件...');
app.use(cors(corsOptions));

// 添加预检请求处理
app.options('*', cors(corsOptions));

app.use(express.json({ limit: config.upload.maxFileSize }));
app.use(sanitizeInput);

// 响应中间件（提供 res.standard 方法）
const responseMiddleware = require('./src/middleware/response');
app.use(responseMiddleware);

// 请求日志中间件
app.use(logger.requestLogger());

// 导入认证路由
const authRoutes = require('./src/routes/auth');
app.use('/api/v1/auth', authRoutes);

// 导入新的签到系统路由
const employeeRoutes = require('./src/routes/employees');
const checkinRoutes = require('./src/routes/checkins');
const worksiteRoutes = require('./src/routes/worksites');
const qrcodeRoutes = require('./src/routes/qrcode');
const licenseRoutes = require('./src/routes/licenses');
const departmentRoutes = require('./src/routes/departments');
const attendanceStatsRoutes = require('./src/routes/attendanceStats');

app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/checkins', checkinRoutes);
app.use('/api/v1/worksites', worksiteRoutes);
app.use('/api/v1/qrcode', qrcodeRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/attendance-stats', attendanceStatsRoutes);

// 添加静态文件服务用于证件上传目录 /uploads
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// 导入全局错误处理中间件
const { globalErrorHandler, notFoundHandler } = require('./src/middleware/globalErrorHandler');

// 考勤路由
const attendanceRoutes = require('./src/routes/attendance');
app.use('/api/v1/attendance', attendanceRoutes);

app.get('/api/v1/vehicles/stats', async (req, res) => {
  try {
    logger.info('Fetching vehicle statistics');
    const vehicles = await Vehicle.findAll();
    const stats = {
      running: vehicles.filter(v => v.status === 'running').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      offline: vehicles.filter(v => v.status === 'offline').length
    };
    logger.info('Vehicle statistics retrieved', { stats });
    
    // 使用标准响应格式
    return res.standard(stats, { message: '获取车辆统计成功' });
  } catch (error) {
    logger.error('Vehicle statistics error', { error: error.message, stack: error.stack });
    return res.standard(null, { message: '获取车辆统计失败', status: 500 });
  }
});

app.get('/api/v1/monitoring/stats', async (req, res) => {
  try {
    logger.info('Fetching monitoring statistics');
    const cameras = await Camera.findAll();
    const stats = {
      online: cameras.filter(c => c.status === 'online').length,
      recording: cameras.filter(c => c.is_recording).length,
      alert: 3, // 模拟报警数量
      offline: cameras.filter(c => c.status === 'offline').length
    };
    logger.info('Monitoring statistics retrieved', { stats });
    
    // 使用标准响应格式
    return res.standard(stats, { message: '获取监控统计成功' });
  } catch (error) {
    logger.error('Monitoring statistics error', { error: error.message, stack: error.stack });
    return res.standard(null, { message: '获取监控统计失败', status: 500 });
  }
});

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'Fleet Management API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/v1/auth/login',
      attendance: '/api/v1/attendance/stats',
      vehicles: '/api/v1/vehicles/stats',
      monitoring: '/api/v1/monitoring/stats',
      employees: '/api/v1/employees',
      checkins: '/api/v1/checkins',
      worksites: '/api/v1/worksites',
      qrcode: '/api/v1/qrcode'
    }
  });
});

// 🔧 健康检查 - 包含CORS配置状态
app.get('/health', (req, res) => {
  const corsStatus = {
    origin: process.env.CORS_ORIGIN,
    corsEnabled: true,
    corsMiddleware: app._router?.stack?.some(layer => layer.name === 'cors') || false
  };
  
  return res.standard({
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    cors: corsStatus
  }, { message: 'OK', status: 200 });
});

// 🔧 CORS配置状态检查端点
app.get('/cors-status', (req, res) => {
  const corsStatus = {
    origin: process.env.CORS_ORIGIN,
    corsEnabled: true,
    corsMiddleware: app._router?.stack?.some(layer => layer.name === 'cors') || false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  res.json(corsStatus);
});



// 全局错误处理中间件（必须在所有路由之后）
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 数据库同步和初始化
const { sequelize } = require('./src/models');
const { hashPassword, generateSecurePassword } = require('./src/utils/passwordUtils');
const seedLicenseTypes = require('./src/services/licenseSeed');
const { startLicenseReminderCron } = require('./src/services/licenseReminder');

async function initializeDatabase() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库表 - 受环境变量控制
    const forceSync = process.env.DB_SYNC_FORCE === 'true';
    await sequelize.sync({ force: forceSync });
    console.log(`✅ 数据库表同步完成 (force: ${forceSync})`);
    
    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      // 生成安全的初始密码
      const initialPassword = generateSecurePassword(16);
      const hashedPassword = await hashPassword(initialPassword);
      
      await User.create({
        employee_id: 'ADMIN001',
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      });
      
      logger.info('Default admin user created successfully');
      logger.warn('Admin initial password', { password: initialPassword });
      logger.warn('Please save this password securely and change it after first login');
    } else {
      logger.info('Admin user already exists, skipping creation');
    }
    
    // 创建示例工地（如果不存在）
    const existingWorksite = await Worksite.findOne({ where: { worksite_id: 'SITE001' } });
    if (!existingWorksite) {
      await Worksite.create({
        worksite_id: 'SITE001',
        name: '示例建筑工地',
        description: '这是一个示例工地，用于演示系统功能',
        center_latitude: -31.9505,
        center_longitude: 115.8605,
        street_address: '123 Construction St',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000',
        status: 'active',
        start_date: new Date(),
        timezone: 'Australia/Perth'
      });
      logger.info('Sample worksite created successfully');
    } else {
      logger.info('Sample worksite already exists, skipping creation');
    }
    
    await seedLicenseTypes();
    logger.info('License type seed data completed');
    
    // 示例数据创建已禁用
    logger.info('Sample data creation is disabled');
    
    // 启动定时任务
    startLicenseReminderCron();
  } catch (error) {
    logger.error('Database initialization error', { error: error.message, stack: error.stack });
  }
}

// 启动服务器
server.listen(PORT, async () => {
  logger.info('Server started', {
    port: PORT,
    apiUrl: `http://localhost:${PORT}/api/v1`,
    healthCheck: `http://localhost:${PORT}/health`,
    corsStatus: `http://localhost:${PORT}/cors-status`,
    endpoints: {
      login: 'POST /api/v1/auth/login',
      attendanceStats: 'GET /api/v1/attendance/stats',
      vehicleStats: 'GET /api/v1/vehicles/stats',
      monitoringStats: 'GET /api/v1/monitoring/stats'
    }
  });
  
  // 初始化数据库
  await initializeDatabase();
  
  // 🔧 启动CORS配置监控
  console.log('🔧 CORS配置监控已启动');
});

// 🔧 定期检查CORS配置 - 每分钟检查一次
setInterval(() => {
  const corsStatus = {
    origin: process.env.CORS_ORIGIN,
    corsEnabled: app._router?.stack?.some(layer => layer.name === 'cors') || false,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 CORS配置健康检查:', corsStatus);
  
  // 如果CORS配置丢失，自动恢复
  if (!process.env.CORS_ORIGIN) {
    console.warn('⚠️ 检测到CORS_ORIGIN丢失，自动恢复');
    process.env.CORS_ORIGIN = 'http://localhost:5173';
  }
}, 60000);

module.exports = app;