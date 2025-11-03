import { ENV } from './env';

/**
 * API Key管理器
 * 支持运行时动态配置API Key，优先使用请求中的Key，否则使用环境变量
 */
class ApiKeyManager {
  // 存储运行时配置的API Key
  private runtimeKeys: Map<string, string> = new Map();

  /**
   * 设置运行时API Key
   */
  setKey(name: string, value: string): void {
    this.runtimeKeys.set(name, value);
  }

  /**
   * 获取API Key（优先使用运行时配置，否则使用环境变量）
   */
  getKey(name: string, requestKey?: string): string {
    // 1. 优先使用请求中传递的Key
    if (requestKey && requestKey.trim()) {
      return requestKey;
    }

    // 2. 使用运行时配置的Key
    const runtimeKey = this.runtimeKeys.get(name);
    if (runtimeKey) {
      return runtimeKey;
    }

    // 3. 使用环境变量中的Key
    switch (name) {
      case 'DEEPSEEK_API_KEY':
        return ENV.DEEPSEEK_API_KEY;
      case 'DEEPSEEK_API_URL':
        return ENV.DEEPSEEK_API_URL;
      case 'AMAP_WEB_API_KEY':
        return ENV.AMAP_WEB_API_KEY;
      default:
        return '';
    }
  }

  /**
   * 清除运行时配置的Key
   */
  clearKey(name: string): void {
    this.runtimeKeys.delete(name);
  }

  /**
   * 清除所有运行时配置的Key
   */
  clearAllKeys(): void {
    this.runtimeKeys.clear();
  }

  /**
   * 检查Key是否可用
   */
  hasKey(name: string): boolean {
    return !!this.getKey(name);
  }
}

// 导出单例
export const apiKeyManager = new ApiKeyManager();

