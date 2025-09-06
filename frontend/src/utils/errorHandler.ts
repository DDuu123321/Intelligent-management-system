// src/utils/errorHandler.ts - 统一错误处理系统
import { ElMessage, ElNotification, ElMessageBox } from "element-plus";
import { logger } from "./logger";
import type { AxiosError } from "axios";
import type { BaseResponse } from "@/types/api";

// 错误码枚举
export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // 认证错误
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  FORBIDDEN = "FORBIDDEN",

  // 验证错误
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

  // 业务错误
  EMPLOYEE_NOT_FOUND = "EMPLOYEE_NOT_FOUND",
  WORKSITE_NOT_FOUND = "WORKSITE_NOT_FOUND",
  CHECKIN_FAILED = "CHECKIN_FAILED",
  INVALID_QR_CODE = "INVALID_QR_CODE",

  // 系统错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",

  // 未知错误
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// 保持向后兼容
export const ERROR_CODES = ErrorCode;

// 错误消息映射
export const ERROR_MESSAGES: Record<string, { zh: string; en: string }> = {
  [ERROR_CODES.UNAUTHORIZED]: {
    zh: "未授权访问，请重新登录",
    en: "Unauthorized access, please login again",
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    zh: "登录已过期，请重新登录",
    en: "Login expired, please login again",
  },
  [ERROR_CODES.FORBIDDEN]: {
    zh: "权限不足，无法访问",
    en: "Insufficient permissions",
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    zh: "数据验证失败",
    en: "Data validation failed",
  },
  [ERROR_CODES.DUPLICATE_ENTRY]: {
    zh: "数据已存在",
    en: "Data already exists",
  },
  [ERROR_CODES.RESOURCE_NOT_FOUND]: {
    zh: "资源未找到",
    en: "Resource not found",
  },
  [ERROR_CODES.EMPLOYEE_NOT_FOUND]: {
    zh: "员工不存在",
    en: "Employee not found",
  },
  [ERROR_CODES.WORKSITE_NOT_FOUND]: {
    zh: "工地不存在",
    en: "Worksite not found",
  },
  [ERROR_CODES.CHECKIN_FAILED]: {
    zh: "签到失败",
    en: "Check-in failed",
  },
  [ERROR_CODES.INVALID_QR_CODE]: {
    zh: "无效的二维码",
    en: "Invalid QR code",
  },
  [ERROR_CODES.INTERNAL_ERROR]: {
    zh: "系统内部错误",
    en: "Internal system error",
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    zh: "数据库错误",
    en: "Database error",
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    zh: "网络连接错误",
    en: "Network connection error",
  },
  [ERROR_CODES.FILE_UPLOAD_ERROR]: {
    zh: "文件上传失败",
    en: "File upload failed",
  },
};

// 错误类型
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
  fields?: Record<string, string>;
  id?: string;
}

// 创建应用错误
export function createAppError(
  code: string,
  message?: string,
  details?: any,
  status?: number,
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  error.details = details;
  error.id = generateErrorId();
  return error;
}

// 生成错误ID
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 获取本地化错误消息
export function getLocalizedErrorMessage(
  code: string,
  locale: string = "zh",
): string {
  const messages = ERROR_MESSAGES[code];
  if (!messages) return code;
  return messages[locale as keyof typeof messages] || messages.zh;
}

// 统一错误处理器
export class ErrorHandler {
  private static instance: ErrorHandler;
  private locale: string = "zh";

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  // 处理API错误响应
  handleApiError(error: any): AppError {
    console.error("API Error:", error);

    let appError: AppError;

    if (error.response) {
      // HTTP错误响应
      const { status, data } = error.response;
      const errorData = data as ErrorResponse;

      if (errorData.error?.code) {
        appError = createAppError(
          errorData.error.code,
          errorData.message,
          errorData.error.details,
          status,
        );
        appError.fields = errorData.error.fields;
        appError.id = errorData.error.id;
      } else {
        // 标准HTTP错误
        appError = this.createHttpError(
          status,
          errorData.message || error.message,
        );
      }
    } else if (error.request) {
      // 网络错误
      appError = createAppError(
        ERROR_CODES.NETWORK_ERROR,
        "网络连接失败，请检查网络设置",
        error.request,
      );
    } else {
      // 其他错误
      appError = createAppError(
        ERROR_CODES.INTERNAL_ERROR,
        error.message || "未知错误",
      );
    }

    return appError;
  }

  // 创建HTTP错误
  private createHttpError(status: number, message?: string): AppError {
    let code: string;
    let defaultMessage: string;

    switch (status) {
      case 401:
        code = ERROR_CODES.UNAUTHORIZED;
        defaultMessage = "未授权访问";
        break;
      case 403:
        code = ERROR_CODES.FORBIDDEN;
        defaultMessage = "权限不足";
        break;
      case 404:
        code = ERROR_CODES.RESOURCE_NOT_FOUND;
        defaultMessage = "资源未找到";
        break;
      case 422:
        code = ERROR_CODES.VALIDATION_ERROR;
        defaultMessage = "数据验证失败";
        break;
      case 500:
        code = ERROR_CODES.INTERNAL_ERROR;
        defaultMessage = "服务器内部错误";
        break;
      default:
        code = ERROR_CODES.INTERNAL_ERROR;
        defaultMessage = `HTTP ${status} 错误`;
    }

    return createAppError(code, message || defaultMessage, null, status);
  }

  // 显示错误消息
  showError(
    error: AppError,
    options?: {
      showNotification?: boolean;
      showMessage?: boolean;
      duration?: number;
    },
  ): void {
    const opts = {
      showNotification: false,
      showMessage: true,
      duration: 3000,
      ...options,
    };

    const message = getLocalizedErrorMessage(
      error.code || ERROR_CODES.INTERNAL_ERROR,
      this.locale,
    );

    if (opts.showNotification) {
      ElNotification({
        title: "错误",
        message: message,
        type: "error",
        duration: opts.duration,
        dangerouslyUseHTMLString: false,
      });
    }

    if (opts.showMessage) {
      ElMessage({
        message: message,
        type: "error",
        duration: opts.duration,
        showClose: true,
      });
    }
  }

  // 显示验证错误
  showValidationErrors(fields: Record<string, string>): void {
    const fieldMessages = Object.entries(fields)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join("\n");

    ElNotification({
      title: "验证错误",
      message: fieldMessages,
      type: "error",
      duration: 5000,
      dangerouslyUseHTMLString: false,
    });
  }

  // 记录错误（可发送到日志服务）
  logError(error: AppError, context?: any): void {
    const logData = {
      id: error.id,
      code: error.code,
      message: error.message,
      stack: error.stack,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 在开发环境输出到控制台
    if (process.env.NODE_ENV === "development") {
      console.group(`🔥 Error [${error.code}]`);
      console.error("Error:", error.message);
      console.error("Details:", logData);
      console.groupEnd();
    }

    // 生产环境可以发送到日志服务
    if (process.env.NODE_ENV === "production") {
      // TODO: 发送到日志服务 (如 Sentry, LogRocket 等)
      // logService.sendError(logData)
    }
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷函数
export function handleError(
  error: any,
  options?: Parameters<ErrorHandler["showError"]>[1],
): AppError {
  const appError = errorHandler.handleApiError(error);
  errorHandler.showError(appError, options);
  errorHandler.logError(appError);
  return appError;
}

export function handleValidationError(error: any): void {
  const appError = errorHandler.handleApiError(error);
  if (appError.fields) {
    errorHandler.showValidationErrors(appError.fields);
  } else {
    errorHandler.showError(appError);
  }
  errorHandler.logError(appError);
}
