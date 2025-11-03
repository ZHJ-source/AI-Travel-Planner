import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * 测试DeepSeek API连接
 */
router.post('/deepseek', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    // 发送简单的测试请求
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.choices) {
      return res.json({ success: true, message: 'API Key is valid' });
    }

    return res.status(400).json({ error: 'Invalid API response' });
  } catch (error: any) {
    console.error('DeepSeek test error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }
    
    return res.status(500).json({ 
      error: error.response?.data?.error?.message || 'Failed to test API Key' 
    });
  }
});

/**
 * 测试高德地图API连接
 */
router.post('/amap', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    // 发送简单的测试请求（搜索北京天安门）
    const response = await axios.get(
      'https://restapi.amap.com/v3/place/text',
      {
        params: {
          key: apiKey,
          keywords: '天安门',
          city: '北京',
          offset: 1,
        },
        timeout: 10000,
      }
    );

    if (response.data.status === '1') {
      return res.json({ success: true, message: 'API Key is valid' });
    }

    return res.status(400).json({ 
      error: response.data.info || 'Invalid API response' 
    });
  } catch (error: any) {
    console.error('AMap test error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: error.response?.data?.info || 'Failed to test API Key' 
    });
  }
});

export default router;

