import { callDeepSeek } from './deepseek';
import { TravelRequirements, RawItinerary, Event, AMapPOI } from '../../types';

/**
 * 解析用户输入需求
 */
export async function parseUserRequirements(input: string, customApiKey?: string, customApiUrl?: string): Promise<TravelRequirements> {
  const prompt = `
解析以下旅行需求，提取关键信息。特别注意用户的限制条件和不想去的地方：

用户输入：${input}

请仔细提取以下信息，以JSON格式返回（不要包含任何其他文字）：
{
  "destination": "目的地",
  "days": 天数（数字）,
  "budget": 预算金额（数字，如果没有提到则为null）,
  "travelers": 人数（数字，如果没有提到则为1）,
  "preferences": ["偏好1", "偏好2"],
  "specialNeeds": ["特殊需求或限制条件"]
}

重要提示：
- preferences 是用户喜欢的类型，如：美食、历史、购物、自然风光等
- specialNeeds 是用户的限制条件，特别注意以下关键词：
  * "不想"、"不要"、"避免"、"不去" → 提取为特殊需求
  * "不能"、"无法"、"禁止" → 提取为特殊需求
  * 身体限制、饮食限制、时间限制等 → 提取为特殊需求
  
示例：
输入："我想去广西北海玩3天，但不想去涠洲岛，喜欢海鲜"
输出：{"destination":"北海","days":3,"budget":null,"travelers":1,"preferences":["海鲜"],"specialNeeds":["不去涠洲岛"]}
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
${requirements.specialNeeds && requirements.specialNeeds.length > 0 ? `
⚠️ **特殊需求（必须严格遵守）**：
${requirements.specialNeeds.map(need => `  - ${need}`).join('\n')}
` : ''}

要求：
1. ${requirements.specialNeeds && requirements.specialNeeds.length > 0 ? '**首要原则：必须严格遵守上述所有特殊需求，不得安排用户明确拒绝的地点或活动**' : ''}
2. 每天安排2-4个主要事件（景点、餐厅、娱乐活动）
3. **必须使用真实存在的地点名称，且名称要精确简洁**
   - ✓ 正确示例：故宫、天安门、南京大牌档、秦淮河
   - ✗ 错误示例：故宫景区、天安门广场游览、南京大牌档美食店、秦淮河夜游
   - 避免添加"景区"、"夜游"、"美食街"等后缀，只写核心地点名称
4. 安排合理的时间（使用24小时制，如 09:00）
5. 估算每个事件的时长（分钟）和费用（元）
6. 提供交通和住宿建议
7. 优先考虑用户的偏好，确保行程符合用户期待

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
    const itinerary = JSON.parse(jsonMatch[0]);
    
    console.log('\n========== LLM生成的原始行程 ==========');
    console.log(`天数: ${itinerary.days?.length || 0}`);
    itinerary.days?.forEach((day: any, idx: number) => {
      console.log(`\n第${idx + 1}天 (${day.date}):`);
      day.events?.forEach((event: any, eventIdx: number) => {
        console.log(`  ${eventIdx + 1}. ${event.name} (${event.type})`);
        console.log(`     时间: ${event.time}, 时长: ${event.estimatedDuration}分钟, 费用: ${event.estimatedCost}元`);
      });
    });
    console.log('=====================================\n');
    
    return itinerary;
  } catch (error) {
    console.error('Failed to parse itinerary:', error);
    console.error('Raw response:', response);
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

