// src/utils/secureStorage.ts
// 安全存储工具类 - 提供更安全的客户端存储方案

interface StorageOptions {
  encrypt?: boolean;
  expires?: number; // 过期时间(毫秒)
}

class SecureStorage {
  private encryptionKey: string;

  constructor() {
    // 生成会话密钥 - 每次页面加载都不同
    this.encryptionKey = this.generateSessionKey();
    // 启动时清理损坏的数据
    this.cleanupCorruptedData();
  }

  private generateSessionKey(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode.apply(null, Array.from(randomBytes)));
  }

  // 简单的XOR加密 (生产环境建议使用更强的加密)
  private encrypt(text: string): string {
    if (!this.encryptionKey) return text;

    let result = "";
    for (let i = 0; i < text.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(
        i % this.encryptionKey.length,
      );
      const textChar = text.charCodeAt(i);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(result);
  }

  private decrypt(encryptedText: string): string {
    if (!this.encryptionKey) return encryptedText;

    try {
      const text = atob(encryptedText);
      let result = "";
      for (let i = 0; i < text.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(
          i % this.encryptionKey.length,
        );
        const textChar = text.charCodeAt(i);
        result += String.fromCharCode(textChar ^ keyChar);
      }
      return result;
    } catch {
      return encryptedText;
    }
  }

  // 存储数据
  setItem(key: string, value: any, options: StorageOptions = {}): void {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expires: options.expires ? Date.now() + options.expires : null,
      };

      let serializedData = JSON.stringify(data);

      if (options.encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      // 优先使用sessionStorage存储敏感信息
      if (key.includes("token") || key.includes("auth") || options.encrypt) {
        sessionStorage.setItem(key, serializedData);
      } else {
        localStorage.setItem(key, serializedData);
      }
    } catch (error) {
      console.warn("Failed to store data:", error);
    }
  }

  // 获取数据
  getItem(key: string, encrypted = false): any {
    try {
      // 先尝试从sessionStorage获取
      let data = sessionStorage.getItem(key) || localStorage.getItem(key);

      if (!data) return null;

      if (encrypted) {
        data = this.decrypt(data);
      }

      const parsed = JSON.parse(data);

      // 检查过期时间
      if (parsed.expires && Date.now() > parsed.expires) {
        this.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn("Failed to retrieve data:", error);
      // 清理损坏的数据
      this.removeItem(key);
      return null;
    }
  }

  // 删除数据
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }

  // 清理过期和损坏的数据
  cleanup(): void {
    const cleanStorage = (storage: Storage) => {
      const keys = Object.keys(storage);
      keys.forEach((key) => {
        try {
          const data = storage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.expires && Date.now() > parsed.expires) {
              storage.removeItem(key);
            }
          }
        } catch {
          // 删除无效的数据
          storage.removeItem(key);
          console.warn(`Removed corrupted data for key: ${key}`);
        }
      });
    };

    cleanStorage(localStorage);
    cleanStorage(sessionStorage);
  }

  // 清理所有损坏的数据
  cleanupCorruptedData(): void {
    const cleanStorage = (storage: Storage) => {
      const keys = [...Object.keys(storage)]; // 创建副本避免遍历时修改
      keys.forEach((key) => {
        try {
          const data = storage.getItem(key);
          if (data) {
            JSON.parse(data); // 尝试解析
          }
        } catch {
          storage.removeItem(key);
          // 仅在开发环境输出警告
          if (import.meta.env.DEV) {
            console.warn(`Removed corrupted data for key: ${key}`);
          }
        }
      });
    };

    cleanStorage(localStorage);
    cleanStorage(sessionStorage);
  }

  // Token专用方法 - 更高安全性
  setToken(token: string): void {
    this.setItem("auth_token", token, {
      encrypt: true,
      expires: 7 * 24 * 60 * 60 * 1000, // 7天过期
    });
  }

  getToken(): string | null {
    return this.getItem("auth_token", true);
  }

  removeToken(): void {
    this.removeItem("auth_token");
  }

  // 用户信息专用方法
  setUser(user: any): void {
    this.setItem("user_info", user, {
      encrypt: true,
      expires: 7 * 24 * 60 * 60 * 1000,
    });
  }

  getUser(): any {
    return this.getItem("user_info", true);
  }

  removeUser(): void {
    this.removeItem("user_info");
  }

  // 清理所有认证信息
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
    // 清理其他可能的认证相关数据
    this.removeItem("token");
    this.removeItem("user");
  }
}

// 导出单例
export const secureStorage = new SecureStorage();

// 定期清理过期数据
setInterval(
  () => {
    secureStorage.cleanup();
  },
  60 * 60 * 1000,
); // 每小时清理一次

export default secureStorage;
