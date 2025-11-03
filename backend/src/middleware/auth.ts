import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * 验证JWT Token中间件
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware - checking token:', {
      hasAuthHeader: !!authHeader,
      headerPreview: authHeader?.substring(0, 20),
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware - No valid auth header');
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    const token = authHeader.substring(7);
    console.log('Auth middleware - Token extracted, length:', token.length);
    
    // 验证token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    console.log('Auth middleware - Verification result:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message,
    });
    
    if (error || !user) {
      console.log('Auth middleware - Token verification failed:', error?.message);
      res.status(401).json({ error: 'Invalid or expired token', details: error?.message });
      return;
    }
    
    req.user = {
      id: user.id,
      email: user.email,
    };
    
    console.log('Auth middleware - Success, user:', req.user.id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * 可选的认证中间件（允许未登录用户访问）
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
        };
      }
    }
    
    next();
  } catch (error) {
    // 忽略错误，继续处理请求
    next();
  }
}

