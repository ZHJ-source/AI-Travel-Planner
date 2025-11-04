import { TravelRequirements, Itinerary, ItineraryDay, Event, RawItinerary } from '../../types';
import { generateItinerary, selectSubEvents } from '../llm/planner';
import { validateLocation, getNearbyRecommendations, parseLocation } from '../map/amap';

/**
 * 生成完整行程（主控Agent）
 */
export async function* generateCompleteItinerary(
  requirements: TravelRequirements,
  userId?: string,
  customApiKeys?: { deepseek?: string; deepseekUrl?: string; amap?: string }
): AsyncGenerator<{ step: string; progress: number; data?: any }> {
  try {
    console.log('Starting itinerary generation for:', requirements);
    
    // 阶段1：LLM生成初步行程
    yield { step: 'generating', progress: 10 };
    console.log('Step 1: Generating initial itinerary...');
    
    const rawItinerary: RawItinerary = await generateItinerary(requirements, customApiKeys?.deepseek, customApiKeys?.deepseekUrl);
    console.log('Raw itinerary generated:', rawItinerary);
    
    // 阶段2：验证地点
    yield { step: 'validating', progress: 40 };
    console.log('Step 2: Validating locations...');
    
    const validatedDays = await validateItineraryDays(
      rawItinerary.days,
      requirements.destination,
      customApiKeys?.amap
    );
    console.log('Validated days:', validatedDays);
    
    // 阶段3：丰富内容（添加附属事件）
    yield { step: 'enriching', progress: 70 };
    console.log('Step 3: Enriching itinerary...');
    
    const enrichedDays = await enrichItineraryDays(validatedDays, customApiKeys);
    console.log('Enriched days:', enrichedDays);
    
    // 阶段4：构建最终行程
    yield { step: 'finalizing', progress: 90 };
    console.log('Step 4: Finalizing...');
    
    const itinerary: Itinerary = {
      userId,
      title: `${requirements.destination}${requirements.days}日游`,
      destination: requirements.destination,
      startDate: requirements.startDate,
      days: enrichedDays,
      travelers: requirements.travelers || 1,
      budget: requirements.budget,
      preferences: requirements.preferences,
      status: 'draft',
      transportation: rawItinerary.transportation,
      accommodation: rawItinerary.accommodation,
    };
    
    console.log('Final itinerary:', itinerary);
    yield { step: 'complete', progress: 100, data: itinerary };
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
}

/**
 * 验证行程中的所有地点
 */
async function validateItineraryDays(
  days: RawItinerary['days'],
  city: string,
  customApiKey?: string
): Promise<ItineraryDay[]> {
  const validatedDays: ItineraryDay[] = [];
  
  console.log('\n========== 开始地点验证 ==========');
  console.log(`总天数: ${days.length}`);
  console.log(`目标城市: ${city}`);
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const validEvents: Event[] = [];
    
    console.log(`\n--- 第${i + 1}天 (${day.date}) ---`);
    console.log(`原始事件数: ${day.events.length}`);
    
    for (let j = 0; j < day.events.length; j++) {
      const event = day.events[j];
      
      console.log(`\n  验证地点 ${j + 1}/${day.events.length}: "${event.name}"`);
      console.log(`    类型: ${event.type}`);
      console.log(`    描述: ${event.description}`);
      console.log(`    时间: ${event.time}`);
      
      // 在验证之前添加延迟，避免API限流（除了第一个地点）
      if (j > 0 || i > 0) {
        await sleep(300); // 300ms延迟
      }
      
      // 验证地点是否存在
      const validation = await validateLocation(event.name, city, customApiKey);
      
      if (validation.valid && validation.poi) {
        const location = parseLocation(validation.poi.location);
        
        console.log(`    ✓ 验证成功`);
        console.log(`      实际名称: ${validation.poi.name}`);
        console.log(`      地址: ${validation.poi.address}`);
        console.log(`      坐标: ${location?.lat}, ${location?.lng}`);
        
        validEvents.push({
          eventOrder: j,
          type: event.type as any,
          name: event.name,
          description: event.description,
          startTime: event.time,
          estimatedDuration: event.estimatedDuration,
          estimatedCost: event.estimatedCost,
          locationName: validation.poi.name,
          address: validation.poi.address,
          latitude: location?.lat,
          longitude: location?.lng,
          poiId: validation.poi.id,
          isMainEvent: true,
          subEvents: [],
        });
      } else {
        console.log(`    ✗ 验证失败 - 地点在高德地图中未找到`);
        console.log(`      原因: ${validation.message || '未知'}`);
      }
    }
    
    console.log(`\n  第${i + 1}天验证结果: ${validEvents.length}/${day.events.length} 个地点有效`);
    
    if (validEvents.length > 0) {
      validatedDays.push({
        dayNumber: i + 1,
        date: day.date,
        events: validEvents,
      });
      console.log(`  ✓ 第${i + 1}天已保留`);
    } else {
      console.log(`  ✗ 第${i + 1}天所有地点验证失败，整天被丢弃！`);
    }
  }
  
  console.log(`\n========== 验证完成 ==========`);
  console.log(`原始天数: ${days.length}`);
  console.log(`最终天数: ${validatedDays.length}`);
  console.log(`丢失天数: ${days.length - validatedDays.length}`);
  
  return validatedDays;
}

/**
 * 丰富行程（添加附属事件）
 */
async function enrichItineraryDays(
  days: ItineraryDay[],
  customApiKeys?: { deepseek?: string; deepseekUrl?: string; amap?: string }
): Promise<ItineraryDay[]> {
  const enrichedDays: ItineraryDay[] = [];
  
  for (const day of days) {
    const enrichedEvents: Event[] = [];
    
    for (const mainEvent of day.events) {
      // 添加主事件
      enrichedEvents.push(mainEvent);
      
      // 获取周边POI
      if (mainEvent.longitude && mainEvent.latitude) {
        const location = `${mainEvent.longitude},${mainEvent.latitude}`;
        const nearbyPOIs = await getNearbyRecommendations(location, mainEvent.type, customApiKeys?.amap);
        
        if (nearbyPOIs.length > 0) {
          // LLM筛选附属事件
          const selectedNames = await selectSubEvents(mainEvent, nearbyPOIs, customApiKeys?.deepseek, customApiKeys?.deepseekUrl);
          
          // 添加附属事件
          const subEvents: Event[] = [];
          for (const name of selectedNames) {
            const poi = nearbyPOIs.find(p => p.name === name);
            if (poi) {
              const location = parseLocation(poi.location);
              subEvents.push({
                eventOrder: enrichedEvents.length,
                type: 'restaurant', // 附属事件通常是餐饮或购物
                name: poi.name,
                description: `距离${mainEvent.name}约${poi.distance}米`,
                locationName: poi.name,
                address: poi.address,
                latitude: location?.lat,
                longitude: location?.lng,
                poiId: poi.id,
                isMainEvent: false,
              });
            }
          }
          
          mainEvent.subEvents = subEvents;
        }
      }
    }
    
    enrichedDays.push({
      ...day,
      events: enrichedEvents,
    });
  }
  
  return enrichedDays;
}

/**
 * 延迟函数，用于避免API限流
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

