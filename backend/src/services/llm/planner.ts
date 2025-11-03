import { callDeepSeek } from './deepseek';
import { TravelRequirements, RawItinerary, Event, AMapPOI } from '../../types';

/**
 * 解析用户输入需求
 */
export async function parseUserRequirements(input: string, customApiKey?: string, customApiUrl?: string): Promise<TravelRequirements> {
  const prompt = `
解析以下旅行需求，提取关键信息：

用户输入：${input}

请以JSON格式返回，不要包含任何其他文字：
{
  "destination": "目的地",
  "days": 天数（数字）,
  "budget": 预算金额（数字，如果没有提到则为null）,
  "travelers": 人数（数字，如果没有提到则为1）,
  "preferences": ["偏好1", "偏好2"],
  "specialNeeds": ["特殊需求"]
}
`;

  const response = await callDeepSeek(prompt, undefined, customApiKey, customApiUrl);
  
  try {
    // 提取JSON内容
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse requirements:', error);
    throw new Error('Failed to parse travel requirements');
  }
}

/**
 * 生成初步行程计划
 */
export async function generateItinerary(requirements: TravelRequirements, customApiKey?: string, customApiUrl?: string): Promise<RawItinerary> {
  const prompt = `
根据以下信息生成${requirements.days}天的详细旅行计划：

- 目的地：${requirements.destination}
${requirements.budget ? `- 预算：${requirements.budget}元` : ''}
${requirements.travelers ? `- 人数：${requirements.travelers}人` : ''}
${requirements.preferences && requirements.preferences.length > 0 ? `- 偏好：${requirements.preferences.join('、')}` : ''}
${requirements.specialNeeds && requirements.specialNeeds.length > 0 ? `- 特殊需求：${requirements.specialNeeds.join('、')}` : ''}

要求：
1. 每天安排2-4个主要事件（景点、餐厅、娱乐活动）
2. 必须使用真实存在的地点名称（景点、餐厅等）
3. 安排合理的时间（使用24小时制，如 09:00）
4. 估算每个事件的时长（分钟）和费用（元）
5. 提供交通和住宿建议

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
  "days": [
    {
      "date": "第1天",
      "events": [
        {
          "time": "09:00",
          "type": "attraction",
          "name": "具体景点名称",
          "description": "简短描述",
          "estimatedDuration": 120,
          "estimatedCost": 100
        }
      ]
    }
  ],
  "transportation": {
    "type": "飞机/火车/自驾",
    "details": "具体交通安排",
    "estimatedCost": 3000
  },
  "accommodation": {
    "type": "酒店/民宿",
    "details": "住宿建议",
    "estimatedCost": 2000
  }
}

注意：type只能是以下之一：attraction（景点）、restaurant（餐厅）、hotel（酒店）、transportation（交通）、entertainment（娱乐）、shopping（购物）
`;

  const response = await callDeepSeek(prompt, undefined, customApiKey, customApiUrl);
  
  try {
    // 提取JSON内容
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse itinerary:', error);
    throw new Error('Failed to generate itinerary');
  }
}

/**
 * 从周边POI中筛选附属事件
 */
export async function selectSubEvents(
  mainEvent: Event,
  nearbyPOIs: AMapPOI[],
  customApiKey?: string,
  customApiUrl?: string
): Promise<string[]> {
  if (nearbyPOIs.length === 0) {
    return [];
  }

  const prompt = `
主要事件：${mainEvent.name}（类型：${mainEvent.type}）
时间：${mainEvent.startTime || '未指定'}
预计时长：${mainEvent.estimatedDuration || 60}分钟

周边地点（按距离排序）：
${nearbyPOIs.map((poi, i) => `${i + 1}. ${poi.name}（类型：${poi.type}，距离：${poi.distance}米，地址：${poi.address}）`).join('\n')}

请从周边地点中选择1-3个适合顺带游览的地点，考虑因素：
1. 距离（优先选择500米以内）
2. 类型互补（如主要事件是景点，可以选择附近餐厅或咖啡店）
3. 时间充裕度

请以JSON数组格式返回选中的地点名称，不要包含任何其他文字：
["地点1名称", "地点2名称"]

如果没有合适的地点，返回空数组：[]
`;

  const response = await callDeepSeek(prompt, undefined, customApiKey, customApiUrl);
  
  try {
    // 提取JSON数组
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return [];
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse sub events:', error);
    return [];
  }
}

/**
 * 估算预算
 */
export async function estimateBudget(
  destination: string,
  days: number,
  travelers: number,
  events: Event[],
  customApiKey?: string,
  customApiUrl?: string
): Promise<any> {
  const prompt = `
请为以下旅行计划估算详细预算：

目的地：${destination}
天数：${days}天
人数：${travelers}人

行程内容：
${events.map(e => `- ${e.name}（${e.type}）`).join('\n')}

请估算以下费用（单位：元人民币）：
1. 交通费（往返大交通 + 市内交通）
2. 住宿费（${days}晚）
3. 餐饮费（早中晚餐）
4. 门票费（景点门票）
5. 其他费用（购物、娱乐等）

请以JSON格式返回，不要包含任何其他文字：
{
  "transportationBudget": 3000,
  "transportationDetail": "往返机票2500元，市内交通500元",
  "accommodationBudget": 2000,
  "accommodationDetail": "每晚400元 × 5晚",
  "mealsBudget": 1500,
  "mealsDetail": "人均100元/天 × 5天 × ${travelers}人",
  "ticketsBudget": 800,
  "ticketsDetail": "景点门票估算",
  "othersBudget": 500,
  "othersDetail": "购物、娱乐等",
  "totalBudget": 7800,
  "budgetStatus": "适中"
}

budgetStatus可以是：宽裕、适中、紧张
`;

  const response = await callDeepSeek(prompt, undefined, customApiKey, customApiUrl);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse budget:', error);
    throw new Error('Failed to estimate budget');
  }
}

