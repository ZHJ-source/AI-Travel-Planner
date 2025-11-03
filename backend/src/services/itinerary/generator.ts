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
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const validEvents: Event[] = [];
    
    for (let j = 0; j < day.events.length; j++) {
      const event = day.events[j];
      
      // 验证地点是否存在
      const validation = await validateLocation(event.name, city, customApiKey);
      
      if (validation.valid && validation.poi) {
        const location = parseLocation(validation.poi.location);
        
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
        console.log(`地点不存在，已过滤：${event.name}`);
      }
    }
    
    if (validEvents.length > 0) {
      validatedDays.push({
        dayNumber: i + 1,
        date: day.date,
        events: validEvents,
      });
    }
  }
  
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

