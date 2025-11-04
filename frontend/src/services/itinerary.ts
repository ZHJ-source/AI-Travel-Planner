import api from './api';
import { TravelRequirements, Itinerary } from '../types';

/**
 * 生成行程（SSE流式响应）
 */
export async function generateItinerary(
  requirements: TravelRequirements,
  onProgress: (update: any) => void,
  input?: string
): Promise<void> {
  console.log('Generating itinerary with requirements:', requirements);
  if (input) {
    console.log('Using natural language input:', input);
  }
  
  const requestBody = input 
    ? { input } 
    : { requirements };
  
  const response = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Response error:', errorText);
    throw new Error(`Failed to generate itinerary: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log('Stream completed');
      break;
    }
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // 保留最后一个不完整的行
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.substring(6);
          console.log('Received data:', jsonStr);
          const data = JSON.parse(jsonStr);
          onProgress(data);
        } catch (e) {
          console.error('Failed to parse SSE data:', e, 'Line:', line);
        }
      }
    }
  }
  
  // 处理剩余的buffer
  if (buffer.startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.substring(6));
      onProgress(data);
    } catch (e) {
      console.error('Failed to parse final SSE data:', e);
    }
  }
}

/**
 * 保存行程
 */
export async function saveItinerary(itinerary: Itinerary) {
  console.log('📤 Sending itinerary to save:', {
    title: itinerary.title,
    destination: itinerary.destination,
    daysCount: itinerary.days?.length,
    firstDay: itinerary.days?.[0],
  });
  
  // 输出完整的行程数据用于调试
  console.log('📄 Complete itinerary data:', JSON.stringify(itinerary, null, 2));
  
  const response = await api.post('/api/itinerary', itinerary);
  return response.data;
}

/**
 * 获取用户的所有行程
 */
export async function getItineraries() {
  const response = await api.get('/api/itinerary/list');
  return response.data.itineraries;
}

/**
 * 获取单个行程详情
 */
export async function getItinerary(id: string) {
  const response = await api.get(`/api/itinerary/${id}`);
  return response.data;
}

/**
 * 更新行程
 */
export async function updateItinerary(id: string, itinerary: Itinerary) {
  console.log('📤 Updating itinerary:', id);
  const response = await api.put(`/api/itinerary/${id}`, itinerary);
  return response.data;
}

/**
 * 删除行程
 */
export async function deleteItinerary(id: string) {
  const response = await api.delete(`/api/itinerary/${id}`);
  return response.data;
}

/**
 * 估算预算
 */
export async function estimateBudget(data: {
  destination: string;
  days: number;
  travelers: number;
  events: any[];
}) {
  const response = await api.post('/api/itinerary/budget/estimate', data);
  return response.data;
}

