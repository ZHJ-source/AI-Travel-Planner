import { Router, Response } from 'express';
import { AuthRequest, authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { ApiKeyRequest } from '../middleware/apikey';
import { parseUserRequirements, estimateBudget } from '../services/llm/planner';
import { generateCompleteItinerary } from '../services/itinerary/generator';
import { supabaseAdmin } from '../config/supabase';
import { Itinerary } from '../types';

const router = Router();

/**
 * 生成行程（支持流式响应）
 */
router.post('/generate', optionalAuthMiddleware, async (req: AuthRequest & ApiKeyRequest, res: Response) => {
  try {
    const { input, requirements } = req.body;
    
    console.log('Generate request:', { input, requirements });
    
    let travelReqs;
    
    // 获取自定义API Key
    const customApiKeys = req.customApiKeys;
    
    if (input) {
      // 从自然语言输入解析需求
      console.log('Parsing natural language input...');
      travelReqs = await parseUserRequirements(input, customApiKeys?.deepseek);
    } else if (requirements) {
      // 直接使用结构化需求
      console.log('Using structured requirements');
      travelReqs = requirements;
    } else {
      res.status(400).json({ error: 'Input or requirements are required' });
      return;
    }
    
    console.log('Travel requirements:', travelReqs);
    console.log('📋 用户需求详情:');
    console.log('  - 目的地:', travelReqs.destination);
    console.log('  - 天数:', travelReqs.days);
    console.log('  - 偏好:', travelReqs.preferences || '无');
    console.log('  - 特殊需求:', travelReqs.specialNeeds || '无');
    
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
        res.flush?.();
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

