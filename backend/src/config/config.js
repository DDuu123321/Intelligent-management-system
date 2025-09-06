// src/config/config.js
require('dotenv').config();

const config = {
  development: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
      sessionTimeout: process.env.SESSION_TIMEOUT || '24h',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    upload: {
      maxFileSize: process.env.MAX_FILE_SIZE || '5MB',
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    },
    rateLimit: {
      windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100
    }
  },
  
  production: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 200
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      sessionTimeout: process.env.SESSION_TIMEOUT || '2h',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
      forceHttps: process.env.FORCE_HTTPS === 'true',
      secureCookies: process.env.SECURE_COOKIES === 'true'
    },
    upload: {
      maxFileSize: process.env.MAX_FILE_SIZE || '5MB',
      uploadDir: process.env.UPLOAD_DIR || './uploads'
    },
    rateLimit: {
      windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 50
    }
  }
};

const currentEnv = process.env.NODE_ENV || 'development';

// 环境变量验证
function validateConfig() {
  const requiredVars = ['JWT_SECRET'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (currentEnv === 'production' && process.env.JWT_SECRET.includes('CHANGE_THIS')) {
    throw new Error('JWT_SECRET must be changed in production environment');
  }
}

validateConfig();

module.exports = config[currentEnv];