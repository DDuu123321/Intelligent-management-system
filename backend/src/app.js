const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
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

const app = express();
const server = createServer(app);

// Socket.IO 配置
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置 - 添加详细日志
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

console.log('🔧 CORS配置详情:', corsOptions);
app.use(cors(corsOptions));

// 添加CORS预检请求处理
app.options('*', cors(corsOptions));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const responseMiddleware = require('./middleware/response');
app.use(responseMiddleware);

// 数据库初始化
const db = require('./models');

// 路由
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const vehicleRoutes = require('./routes/vehicles');
const monitoringRoutes = require('./routes/monitoring');
const qrcodeRoutes = require('./routes/qrcode');
const attendanceStatsRoutes = require('./routes/attendanceStats');
const worksiteRoutes = require('./routes/worksites');
const employeeRoutes = require('./routes/employees');
const licenseRoutes = require('./routes/licenses');
const checkinRoutes = require('./routes/checkins');
const statsRoutes = require('./routes/stats');
const publicRoutes = require('./routes/public');
let departmentRoutes;
try {
  console.log('🔧 Attempting to load department routes...');
  departmentRoutes = require('./routes/departments-simple');
  console.log('🔧 Department routes loaded successfully');
} catch (error) {
  console.error('🔧 Failed to load department routes:', error.message);
  console.error('🔧 Full error:', error);
}

const apiPrefix = process.env.API_PREFIX;

// 公开路由（不需要认证）
app.use(`${apiPrefix}/public`, publicRoutes);

// 需要认证的路由
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);
app.use(`${apiPrefix}/vehicles`, vehicleRoutes);
app.use(`${apiPrefix}/monitoring`, monitoringRoutes);
app.use(`${apiPrefix}/qrcode`, qrcodeRoutes);
app.use(`${apiPrefix}/attendance-stats`, attendanceStatsRoutes);
app.use(`${apiPrefix}/worksites`, worksiteRoutes);
app.use(`${apiPrefix}/employees`, employeeRoutes);
app.use(`${apiPrefix}/licenses`, licenseRoutes);
app.use(`${apiPrefix}/checkins`, checkinRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);
if (departmentRoutes) {
  app.use(`${apiPrefix}/departments`, departmentRoutes);
  console.log('🔧 Department routes registered successfully');
} else {
  console.error('🔧 Department routes not available - skipping registration');
}

// 🔧 调试：输出注册的路由
console.log('🔧 注册的路由:');
console.log('   考勤路由:', `${apiPrefix}/attendance`);
console.log('   路由栈数量:', app._router.stack.length);
app._router.stack.forEach((layer, i) => {
  if (layer.regexp.toString().includes('attendance')) {
    console.log(`   找到考勤路由 ${i}:`, layer.regexp.toString());
  }
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

// 首页
app.get('/', (req, res) => {
  res.json({
    message: 'Fleet Management API Server',
    version: '1.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN,
      status: 'configured'
    },
    endpoints: {
      auth: `${apiPrefix}/auth`,
      attendance: `${apiPrefix}/attendance`,
      'attendance-stats': `${apiPrefix}/attendance-stats`,
      vehicles: `${apiPrefix}/vehicles`,
      monitoring: `${apiPrefix}/monitoring`,
      qrcode: `${apiPrefix}/qrcode`,
      health: '/health',
      corsStatus: '/cors-status'
    }
  });
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

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 加入房间
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`用户 ${socket.id} 加入房间: ${room}`);
  });

  // 离开房间
  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`用户 ${socket.id} 离开房间: ${room}`);
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 实时数据推送服务
const startRealtimeServices = () => {
  // 车辆位置更新（每30秒）
  setInterval(() => {
    io.to('vehicles').emit('vehicle-update', {
      type: 'location',
      data: generateMockVehicleData()
    });
  }, 30000);

  // 考勤数据更新（每分钟）
  setInterval(() => {
    io.to('attendance').emit('attendance-update', {
      type: 'checkin',
      data: generateMockAttendanceData()
    });
  }, 60000);

  // 监控报警（随机）
  setInterval(() => {
    if (Math.random() < 0.1) { // 10% 概率
      io.to('monitoring').emit('alert', {
        type: 'security',
        data: generateMockAlertData()
      });
    }
  }, 10000);
};

// 模拟数据生成函数
const generateMockVehicleData = () => {
  return {
    vehicleId: `V${Math.floor(Math.random() * 50) + 1}`,
    lat: -31.9505 + (Math.random() - 0.5) * 0.1,
    lng: 115.8605 + (Math.random() - 0.5) * 0.1,
    speed: Math.floor(Math.random() * 80),
    timestamp: new Date().toISOString()
  };
};

const generateMockAttendanceData = () => {
  return {
    employeeId: `E${Math.floor(Math.random() * 200) + 1}`,
    type: Math.random() > 0.5 ? 'checkin' : 'checkout',
    timestamp: new Date().toISOString()
  };
};

const generateMockAlertData = () => {
  const alerts = [
    '异常入侵检测',
    '车辆超速警告',
    '设备故障',
    '围栏报警',
    '火灾报警'
  ];
  
  return {
    id: Date.now(),
    title: alerts[Math.floor(Math.random() * alerts.length)],
    level: Math.random() > 0.7 ? 'high' : 'medium',
    location: `区域${Math.floor(Math.random() * 10) + 1}`,
    timestamp: new Date().toISOString()
  };
};

const { globalErrorHandler, notFoundHandler } = require('./middleware/globalErrorHandler');

// 错误处理中间件
app.use(globalErrorHandler);

// 404 处理
app.use(notFoundHandler);

// 数据库同步和服务启动
const startServer = async () => {
  try {
    // 同步数据库
    await db.sequelize.sync({ force: false });
    console.log('数据库连接成功');

    // 启动实时服务
    startRealtimeServices();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API地址: http://localhost:${PORT}${apiPrefix}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

// 导出应用和启动函数
module.exports = { app, server, io, startServer };

// 如果直接运行此文件
if (require.main === module) {
  startServer();
}