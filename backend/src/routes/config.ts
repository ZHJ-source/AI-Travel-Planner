import { Router, Request, Response } from 'express';
import { apiKeyManager } from '../config/apiKeyManager';

const router = Router();

/**
 * 保存 Supabase Service Role Key
 * 注意：这个Key保存在后端内存中，重启服务后需要重新配置
 */
router.post('/service-key', async (req: Request, res: Response) => {
  try {
    const { supabaseServiceRoleKey } = req.body;

    if (!supabaseServiceRoleKey || !supabaseServiceRoleKey.trim()) {
      return res.status(400).json({ error: 'Service Role Key is required' });
    }

    // 保存到运行时配置
    apiKeyManager.setKey('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);

    console.log('✅ Supabase Service Role Key updated successfully');

    res.json({ 
      success: true, 
      message: 'Service Role Key saved successfully (in memory, will reset on server restart)' 
    });
  } catch (error: any) {
    console.error('Failed to save Service Role Key:', error);
    res.status(500).json({ 
      error: 'Failed to save Service Role Key',
      message: error?.message || String(error)
    });
  }
});

/**
 * 获取当前配置状态（不返回实际的Key值）
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const hasServiceKey = apiKeyManager.hasKey('SUPABASE_SERVICE_ROLE_KEY');
    const hasDeepSeekKey = apiKeyManager.hasKey('DEEPSEEK_API_KEY');
    const hasAmapKey = apiKeyManager.hasKey('AMAP_WEB_API_KEY');

    res.json({
      configured: {
        supabaseServiceRoleKey: hasServiceKey,
        deepseekApiKey: hasDeepSeekKey,
        amapWebApiKey: hasAmapKey,
      },
      note: 'Runtime keys will reset on server restart. Environment variables persist.'
    });
  } catch (error) {
    console.error('Failed to get config status:', error);
    res.status(500).json({ error: 'Failed to get config status' });
  }
});

export default router;

