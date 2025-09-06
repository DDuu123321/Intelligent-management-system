// src/middleware/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 允许的文件类型配置
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'text/plain'],
  license: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

// 危险文件扩展名黑名单
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.pl', '.rb', '.sh'
];

class FileUploadSecurity {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // 验证文件类型
  validateFileType(mimetype, allowedTypes) {
    return allowedTypes.includes(mimetype.toLowerCase());
  }

  // 验证文件扩展名
  validateFileExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return !DANGEROUS_EXTENSIONS.includes(ext);
  }

  // 生成安全的文件名
  generateSafeFilename(originalname) {
    const ext = path.extname(originalname);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  // 检查文件大小
  checkFileSize(size, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  // 扫描文件内容（基础恶意文件检测）
  scanFileContent(buffer) {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    
    // 检测常见的恶意脚本模式
    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /eval\s*\(/gi,
      /document\.write/gi
    ];

    return !maliciousPatterns.some(pattern => pattern.test(content));
  }

  // 创建通用文件上传中间件
  createUploadMiddleware(options = {}) {
    const {
      fileType = 'image',
      maxSize = 10, // MB
      maxFiles = 1,
      fieldName = 'file'
    } = options;

    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
      try {
        // 验证文件扩展名
        if (!this.validateFileExtension(file.originalname)) {
          return cb(new Error('不允许的文件类型'), false);
        }

        // 验证MIME类型
        const allowedTypes = ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.image;
        if (!this.validateFileType(file.mimetype, allowedTypes)) {
          return cb(new Error(`不支持的文件格式: ${file.mimetype}`), false);
        }

        cb(null, true);
      } catch (error) {
        cb(error, false);
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxSize * 1024 * 1024,
        files: maxFiles
      }
    });

    // 返回处理中间件
    return (req, res, next) => {
      const uploadHandler = maxFiles === 1 ? 
        upload.single(fieldName) : 
        upload.array(fieldName, maxFiles);

      uploadHandler(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `文件大小不能超过 ${maxSize}MB`
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `最多只能上传 ${maxFiles} 个文件`
            });
          }
          return res.status(400).json({
            success: false,
            message: `文件上传错误: ${err.message}`
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        // 额外的安全检查
        if (req.file || req.files) {
          const files = req.files || [req.file];
          
          for (const file of files) {
            if (!file) continue;

            // 检查文件大小
            if (!this.checkFileSize(file.size, maxSize)) {
              return res.status(400).json({
                success: false,
                message: '文件大小超出限制'
              });
            }

            // 扫描文件内容
            if (!this.scanFileContent(file.buffer)) {
              return res.status(400).json({
                success: false,
                message: '检测到可疑文件内容'
              });
            }

            // 生成安全的文件名
            file.safeName = this.generateSafeFilename(file.originalname);
          }
        }

        next();
      });
    };
  }

  // 保存文件到磁盘
  saveFile(fileBuffer, filename, subdir = '') {
    const targetDir = path.join(this.uploadDir, subdir);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filepath = path.join(targetDir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    
    return filepath;
  }

  // 删除文件
  deleteFile(filename, subdir = '') {
    try {
      const filepath = path.join(this.uploadDir, subdir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }
}

// 创建单例
const fileUploadSecurity = new FileUploadSecurity();

// 预定义的中间件
const uploadMiddlewares = {
  // 证件文件上传
  license: fileUploadSecurity.createUploadMiddleware({
    fileType: 'license',
    maxSize: 10,
    maxFiles: 1,
    fieldName: 'file'
  }),

  // 头像上传
  avatar: fileUploadSecurity.createUploadMiddleware({
    fileType: 'image',
    maxSize: 2,
    maxFiles: 1,
    fieldName: 'avatar'
  }),

  // 文档上传
  document: fileUploadSecurity.createUploadMiddleware({
    fileType: 'document',
    maxSize: 20,
    maxFiles: 5,
    fieldName: 'documents'
  })
};

module.exports = {
  fileUploadSecurity,
  uploadMiddlewares
};