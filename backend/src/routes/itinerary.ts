import { Router, Response } from 'express';
import { AuthRequest, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { ApiKeyRequest } from '../middleware/apikey';
import { parseUserRequirements, estimateBudget } from '../services/llm/planner';
import { generateCompleteItinerary } from '../services/itinerary/generator';
import { supabaseAdmin } from '../config/supabase';
import { Itinerary } from '../types';
import { isChineseCity, normalizeCityName } from '../config/cities';

const router = Router();

/**
 * 生成行程（支持流式响应）
 */
router.post('/generate', optionalAuthMiddleware, async (req: AuthRequest & ApiKeyRequest, res: Response) => {
  try {
    const { input, requirements, additionalInput } = req.body;
    
    console.log('Generate request:', { input, requirements, additionalInput });
    
    let travelReqs;
    
    // 获取自定义API Key
    const customApiKeys = req.customApiKeys;
    
    if (input) {
      // 纯文字模式（向后兼容）- 从自然语言输入解析需求
      console.log('Mode: Pure natural language input');
      try {
        travelReqs = await parseUserRequirements(input, customApiKeys?.deepseek);
      } catch (parseError: any) {
        console.error('Parse error:', parseError);
        res.status(400).json({ 
          error: '需求解析失败',
          message: parseError.message || '无法理解您的旅行需求描述',
          input: input
        });
        return;
      }
    } else if (requirements) {
      // 表单模式或混合模式
      console.log('Mode: Form-based or hybrid');
      travelReqs = { ...requirements };
      
      // 如果有补充说明，智能合并到preferences或specialNeeds
      if (additionalInput && additionalInput.trim()) {
        console.log('📝 补充说明:', additionalInput);
        
        // 初始化数组（保留表单中已有的值）
        if (!travelReqs.preferences) {
          travelReqs.preferences = [];
        }
        if (!travelReqs.specialNeeds) {
          travelReqs.specialNeeds = [];
        }
        
        // 将补充说明按逗号、顿号、分号分割
        const additionalItems = additionalInput
          .split(/[,，、；;\n]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        
        // 关键词识别：判断是偏好还是限制
        const restrictionKeywords = ['不想', '不要', '不去', '避免', '不能', '无法', '禁止', '不吃', '不喜欢', '别'];
        
        const newPreferences: string[] = [];
        const newRestrictions: string[] = [];
        
        for (const item of additionalItems) {
          // 如果包含限制关键词，归类为specialNeeds
          if (restrictionKeywords.some(keyword => item.includes(keyword))) {
            newRestrictions.push(item);
          } else {
            // 否则归类为preferences
            newPreferences.push(item);
          }
        }
        
        // 合并（去重）
        if (newPreferences.length > 0) {
          travelReqs.preferences = Array.from(new Set([...travelReqs.preferences, ...newPreferences]));
        }
        if (newRestrictions.length > 0) {
          travelReqs.specialNeeds = Array.from(new Set([...travelReqs.specialNeeds, ...newRestrictions]));
        }
        
        console.log('  ✓ 合并后的偏好:', travelReqs.preferences);
        console.log('  ✓ 合并后的限制:', travelReqs.specialNeeds);
      }
    } else {
      res.status(400).json({ error: 'Requirements are required' });
      return;
    }
    
    console.log('Travel requirements:', travelReqs);
    console.log('📋 用户需求详情:');
    console.log('  - 目的地:', travelReqs.destination);
    console.log('  - 天数:', travelReqs.days);
    console.log('  - 偏好:', travelReqs.preferences || '无');
    console.log('  - 特殊需求:', travelReqs.specialNeeds || '无');
    
    // 验证目的地
    if (!travelReqs.destination || typeof travelReqs.destination !== 'string') {
      res.status(400).json({ 
        error: '缺少目的地',
        message: '请明确指定旅行目的地'
      });
      return;
    }
    
    // 验证目的地是否为国内城市
    if (!isChineseCity(travelReqs.destination)) {
      res.status(400).json({ 
        error: '目的地必须是中国大陆城市',
        message: '由于本系统使用高德地图API，目前仅支持中国大陆地区的旅行规划。请输入国内城市，如：北京、上海、杭州、成都、西安等。',
        destination: travelReqs.destination
      });
      return;
    }
    
    // 验证并处理天数
    if (travelReqs.days === undefined || travelReqs.days === null) {
      console.warn('⚠️ 天数未提供，使用默认值 5');
      travelReqs.days = 5; // 默认值
    }
    
    const days = parseInt(String(travelReqs.days));
    if (isNaN(days) || days < 1 || days > 30) {
      res.status(400).json({ 
        error: '天数必须是有效数字',
        message: input 
          ? '请在描述中明确指定天数，或使用1-30之间的数字。如果未指定，将默认使用5天。'
          : '请输入有效的天数（1-30天）',
        days: travelReqs.days,
        receivedValue: travelReqs.days
      });
      return;
    }
    travelReqs.days = days; // 确保是数字类型
    
    // 标准化城市名称
    if (travelReqs.destination) {
      const normalizedCity = normalizeCityName(travelReqs.destination);
      if (normalizedCity !== travelReqs.destination) {
        console.log(`城市名称已标准化: ${travelReqs.destination} -> ${normalizedCity}`);
        travelReqs.destination = normalizedCity;
      }
    }
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 生成行程
    try {
      for await (const update of generateCompleteItinerary(travelReqs, req.user?.id, customApiKeys)) {
        console.log('Sending update:', update);
        res.write(`data: ${JSON.stringify(update)}\n\n`);
        // @ts-ignore - flush may exist on response object
        if (typeof res.flush === 'function') res.flush();
      }
      res.end();
    } catch (genError) {
      console.error('Error during itinerary generation:', genError);
      res.write(`data: ${JSON.stringify({ step: 'error', progress: 0, error: String(genError) })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Generate itinerary error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate itinerary', message: String(error) });
    }
  }
});

/**
 * 保存行程
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary: Itinerary = req.body;
    
    // 输出详细的请求数据用于调试
    console.log('📝 Saving itinerary request:', {
      userId: req.user!.id,
      title: itinerary.title,
      destination: itinerary.destination,
      daysCount: itinerary.days?.length,
      hasStartDate: !!itinerary.startDate,
      hasEndDate: !!itinerary.endDate,
    });
    
    // 验证必要字段
    if (!itinerary.title || !itinerary.destination || !itinerary.days || itinerary.days.length === 0) {
      console.error('❌ Missing required fields:', {
        hasTitle: !!itinerary.title,
        hasDestination: !!itinerary.destination,
        hasDays: !!itinerary.days,
        daysLength: itinerary.days?.length,
      });
      res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          title: !itinerary.title ? 'Title is required' : undefined,
          destination: !itinerary.destination ? 'Destination is required' : undefined,
          days: !itinerary.days || itinerary.days.length === 0 ? 'At least one day is required' : undefined,
        }
      });
      return;
    }
    
    itinerary.userId = req.user!.id;
    
    // 保存行程 - 适配简单的 JSONB 表结构
    // 表结构：id, user_id, title, data (JSONB), created_at
    console.log('💾 Adapting to JSONB table structure...');
    
    const insertData = {
      user_id: itinerary.userId,
      title: itinerary.title,
      data: {
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        days: itinerary.days,
        travelers: itinerary.travelers,
        budget: itinerary.budget,
        preferences: itinerary.preferences,
        status: itinerary.status || 'draft',
        transportation: itinerary.transportation,
        accommodation: itinerary.accommodation,
      }
    };
    
    console.log('🔍 Insert data:', {
      user_id: insertData.user_id,
      title: insertData.title,
      dataKeys: Object.keys(insertData.data),
      daysCount: itinerary.days?.length,
    });
    
    const { data: savedItinerary, error: itineraryError } = await supabaseAdmin
      .from('itineraries')
      .insert(insertData)
      .select()
      .single();
    
    if (itineraryError) {
      console.error('❌ Failed to insert itinerary:', itineraryError);
      throw itineraryError;
    }
    
    console.log('✅ Itinerary saved with id:', savedItinerary.id);
    
    console.log('🎉 All itinerary data saved successfully!');
    
    res.json({
      message: 'Itinerary saved successfully',
      itinerary: savedItinerary,
    });
  } catch (error: any) {
    console.error('❌ Save itinerary error:', error);
    console.error('Error details:', {
      message: error?.message,
      hint: error?.hint,
      details: error?.details,
      code: error?.code,
    });
    res.status(500).json({ 
      error: 'Failed to save itinerary',
      message: error?.message || String(error),
      details: error?.hint || error?.details,
    });
  }
});

/**
 * 获取用户的所有行程
 */
router.get('/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // 将 JSONB data 字段展开到顶层
    const itineraries = data?.map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      createdAt: item.created_at,
      ...item.data, // 展开 JSONB 数据
    })) || [];
    
    res.json({ itineraries });
  } catch (error) {
    console.error('List itineraries error:', error);
    res.status(500).json({ error: 'Failed to list itineraries' });
  }
});

/**
 * 获取单个行程详情
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // 获取行程（JSONB 结构）
    const { data: itinerary, error: itineraryError } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();
    
    if (itineraryError || !itinerary) {
      res.status(404).json({ error: 'Itinerary not found' });
      return;
    }
    
    // 将 JSONB data 字段展开到顶层
    const result = {
      id: itinerary.id,
      userId: itinerary.user_id,
      title: itinerary.title,
      createdAt: itinerary.created_at,
      ...itinerary.data, // 展开 JSONB 数据（包含 days, destination 等）
    };
    
    res.json(result);
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ error: 'Failed to get itinerary' });
  }
});

/**
 * 更新行程
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const itinerary: Itinerary = req.body;
    
    console.log('📝 Updating itinerary:', id);
    
    // 验证权限
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('itineraries')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      res.status(404).json({ error: 'Itinerary not found' });
      return;
    }
    
    if (existing.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    // 更新行程
    const updateData = {
      title: itinerary.title,
      data: {
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        days: itinerary.days,
        travelers: itinerary.travelers,
        budget: itinerary.budget,
        preferences: itinerary.preferences,
        status: itinerary.status || 'draft',
        transportation: itinerary.transportation,
        accommodation: itinerary.accommodation,
      }
    };
    
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('itineraries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update itinerary:', updateError);
      throw updateError;
    }
    
    console.log('✅ Itinerary updated successfully');
    
    res.json({
      message: 'Itinerary updated successfully',
      itinerary: updated,
    });
  } catch (error: any) {
    console.error('❌ Update itinerary error:', error);
    res.status(500).json({ 
      error: 'Failed to update itinerary',
      message: error?.message || String(error),
    });
  }
});

/**
 * 删除行程
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({ error: 'Failed to delete itinerary' });
  }
});

/**
 * 估算预算
 */
router.post('/budget/estimate', async (req: ApiKeyRequest, res: Response) => {
  try {
    const { destination, days, travelers, events } = req.body;
    
    const budget = await estimateBudget(destination, days, travelers, events, req.customApiKeys?.deepseek);
    
    res.json(budget);
  } catch (error) {
    console.error('Estimate budget error:', error);
    res.status(500).json({ error: 'Failed to estimate budget' });
  }
});

export default router;

