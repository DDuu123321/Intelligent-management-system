// src/utils/requestCache.ts - 请求缓存和节流机制

interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
}

interface ThrottleItem {
  lastRequest: number;
  delay: number;
}

class RequestCache {
  private cache = new Map<string, CacheItem>();
  private throttle = new Map<string, ThrottleItem>();

  // 默认缓存时间（毫秒）
  private defaultTTL = 30000; // 30秒

  // 默认节流延迟（毫秒）
  private defaultThrottle = 1000; // 1秒

  /**
   * 生成缓存键
   */
  private getCacheKey(url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${url}:${paramStr}`;
  }

  /**
   * 获取缓存数据
   */
  get(url: string, params?: any): any | null {
    const key = this.getCacheKey(url, params);
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存数据
   */
  set(url: string, data: any, ttl?: number, params?: any): void {
    const key = this.getCacheKey(url, params);
    const cacheTTL = ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTTL,
    });
  }

  /**
   * 清除缓存
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 检查是否应该节流请求
   */
  shouldThrottle(url: string, throttleTime?: number): boolean {
    const throttleDelay = throttleTime || this.defaultThrottle;
    const item = this.throttle.get(url);

    if (!item) {
      this.throttle.set(url, {
        lastRequest: Date.now(),
        delay: throttleDelay,
      });
      return false;
    }

    const timeSinceLastRequest = Date.now() - item.lastRequest;

    if (timeSinceLastRequest < item.delay) {
      return true;
    }

    // 更新最后请求时间
    item.lastRequest = Date.now();
    return false;
  }

  /**
   * 等待直到可以发送请求
   */
  async waitForThrottle(url: string, throttleTime?: number): Promise<void> {
    const throttleDelay = throttleTime || this.defaultThrottle;
    const item = this.throttle.get(url);

    if (!item) return;

    const timeSinceLastRequest = Date.now() - item.lastRequest;
    const waitTime = item.delay - timeSinceLastRequest;

    if (waitTime > 0) {
      console.log(`⏳ 请求节流: 等待 ${waitTime}ms 后请求 ${url}`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// 创建全局实例
export const requestCache = new RequestCache();

// 常用缓存配置
export const CACHE_CONFIG = {
  // 统计数据缓存30秒
  STATS: 30000,
  // 列表数据缓存10秒
  LISTS: 10000,
  // 详情数据缓存60秒
  DETAILS: 60000,
  // 很少变化的数据缓存5分钟
  STATIC: 300000,
};

// 节流配置
export const THROTTLE_CONFIG = {
  // 统计API 2秒节流
  STATS: 2000,
  // 搜索API 500ms节流
  SEARCH: 500,
  // 普通API 1秒节流
  DEFAULT: 1000,
};
