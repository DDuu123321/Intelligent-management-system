// src/middleware/validation.js
const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 处理验证错误
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { 
      errors: errors.array(),
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 用户登录验证规则
 */
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
    
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符'),
    
  handleValidationErrors
];

/**
 * 员工创建验证规则
 */
const validateEmployeeCreation = [
  body('employee_id')
    .notEmpty()
    .withMessage('员工ID不能为空')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('员工ID只能包含大写字母和数字'),
    
  body('name')
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度必须在2-100字符之间'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确'),
    
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('电话号码格式不正确'),
    
  handleValidationErrors
];

/**
 * 工地创建验证规则
 */
const validateWorksiteCreation = [
  body('worksite_id')
    .notEmpty()
    .withMessage('工地ID不能为空')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('工地ID只能包含大写字母和数字'),
    
  body('name')
    .notEmpty()
    .withMessage('工地名称不能为空')
    .isLength({ min: 2, max: 200 })
    .withMessage('工地名称长度必须在2-200字符之间'),
    
  body('center_latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
    
  body('center_longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
    
  handleValidationErrors
];

/**
 * ID参数验证
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是正整数'),
    
  handleValidationErrors
];

/**
 * 分页参数验证
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateEmployeeCreation,
  validateWorksiteCreation,
  validateIdParam,
  validatePagination
};