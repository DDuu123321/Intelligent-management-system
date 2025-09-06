// src/utils/request.ts
import axios from "axios";
import { ElMessage } from "element-plus";
import router from "@/router";
import { errorHandler, ERROR_CODES } from "./errorHandler";
import { secureStorage } from "./secureStorage";

// 重试配置 - 优化重试策略
const RETRY_CONFIG = {
  retries: 2, // 减少重试次数
  retryDelay: 1500, // 增加重试延迟
  retryOn: ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ERR_NETWORK"],
  // 不重试的错误码
  noRetryStatusCodes: [400, 401, 403, 404, 422, 429],
};

// 延迟函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token
    const token = secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加重试配置到请求配置中
    (config as any).metadata = { startTime: new Date(), retryCount: 0 };

    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  },
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 如果后端返回的数据格式是 { success: false, ... }
    if (data.success === false) {
      const appError = errorHandler.handleApiError({
        response: {
          status: response.status,
          data: data,
        },
      });

      // 特殊处理认证错误
      if (
        appError.code === ERROR_CODES.UNAUTHORIZED ||
        appError.code === ERROR_CODES.TOKEN_EXPIRED
      ) {
        // 检查是否是签到相关的API
        const isCheckinAPI =
          response.config?.url?.includes("/qrcode/scan/") ||
          response.config?.url?.includes("/qrcode/checkin/");

        if (!isCheckinAPI) {
          secureStorage.clearAuth();
          router.push("/login");
          return Promise.reject(appError);
        }
      }

      errorHandler.showError(appError);
      return Promise.reject(appError);
    }

    return data;
  },
  async (error) => {
    const config = error.config;

    // 检查是否应该重试
    const shouldRetry =
      config &&
      (config as any).metadata &&
      (config as any).metadata.retryCount < RETRY_CONFIG.retries &&
      RETRY_CONFIG.retryOn.includes(error.code) &&
      // 不重试特定状态码
      !RETRY_CONFIG.noRetryStatusCodes.includes(error.response?.status);

    if (shouldRetry) {
      (config as any).metadata.retryCount += 1;
      console.log(
        `请求重试 ${(config as any).metadata.retryCount}/${RETRY_CONFIG.retries}: ${config.url}`,
      );

      // 延迟后重试
      await delay(
        RETRY_CONFIG.retryDelay * (config as any).metadata.retryCount,
      );

      return request(config);
    }

    const appError = errorHandler.handleApiError(error);

    // 特殊处理认证错误
    if (
      appError.code === ERROR_CODES.UNAUTHORIZED ||
      appError.code === ERROR_CODES.TOKEN_EXPIRED
    ) {
      // 检查是否是签到相关的API，如果是，不自动重定向
      const isCheckinAPI =
        config?.url?.includes("/qrcode/scan/") ||
        config?.url?.includes("/qrcode/checkin/");

      if (!isCheckinAPI) {
        secureStorage.clearAuth();
        router.push("/login");
      }
    } else {
      // 显示错误信息（除非是验证错误，验证错误由组件处理）
      if (
        appError.code !== ERROR_CODES.VALIDATION_ERROR &&
        config?.metadata?.retryCount >= RETRY_CONFIG.retries
      ) {
        errorHandler.showError(appError);
      }
    }

    errorHandler.logError(appError);
    return Promise.reject(appError);
  },
);

// 服务健康检查
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get("http://localhost:3000/health", {
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// 等待服务就绪
export const waitForServer = async (maxWaitTime = 30000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    if (await checkServerHealth()) {
      console.log("✅ 后端服务已就绪");
      return true;
    }
    console.log("⏳ 等待后端服务启动...");
    await delay(2000);
  }

  console.error("❌ 后端服务启动超时");
  return false;
};

export default request;
