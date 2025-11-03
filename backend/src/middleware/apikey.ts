import { Request, Response, NextFunction } from 'express';

// 扩展Request接口以包含自定义API Key
export interface ApiKeyRequest extends Request {
  customApiKeys?: {
    deepseek?: string;
    deepseekUrl?: string;
    amap?: string;
  };
}

/**
 * 从请求头中提取自定义API Key和配置
 */
export function extractApiKeys(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): void {
  // 从请求头中提取API Key和配置
  const deepseekKey = req.headers['x-deepseek-api-key'] as string | undefined;
  const deepseekUrl = req.headers['x-deepseek-api-url'] as string | undefined;
  const amapKey = req.headers['x-amap-api-key'] as string | undefined;
  
  if (deepseekKey || deepseekUrl || amapKey) {
    req.customApiKeys = {
      deepseek: deepseekKey,
      deepseekUrl: deepseekUrl,
      amap: amapKey,
    };
  }
  
  next();
}

