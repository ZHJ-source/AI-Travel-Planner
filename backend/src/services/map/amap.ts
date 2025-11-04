import axios from 'axios';
import { apiKeyManager } from '../../config/apiKeyManager';
import { AMapPOI } from '../../types';

interface AMapSearchResponse {
  status: string;
  count: string;
  info: string;
  pois?: AMapPOI[];
}

/**
 * 搜索地点
 */
export async function searchPlace(
  keywords: string,
  city: string,
  customApiKey?: string
): Promise<AMapPOI[]> {
  try {
    // 获取API Key（优先使用自定义Key）
    const apiKey = apiKeyManager.getKey('AMAP_WEB_API_KEY', customApiKey);
    
    if (!apiKey) {
      console.error('AMap API Key not configured');
      return [];
    }

    console.log(`      [高德地图] 搜索: "${keywords}" in ${city}`);

    const response = await axios.get<AMapSearchResponse>(
      'https://restapi.amap.com/v3/place/text',
      {
        params: {
          key: apiKey,
          keywords,
          city,
          citylimit: true,
          offset: 10,
        }
      }
    );

    console.log(`      [高德地图] 响应状态: ${response.data.status}, 结果数: ${response.data.count}`);

    if (response.data.status === '1' && response.data.pois) {
      if (response.data.pois.length > 0) {
        console.log(`      [高德地图] 找到 ${response.data.pois.length} 个结果:`);
        response.data.pois.slice(0, 3).forEach((poi, idx) => {
          console.log(`        ${idx + 1}. ${poi.name} - ${poi.address}`);
        });
      }
      return response.data.pois;
    }
    
    console.log(`      [高德地图] 无结果: ${response.data.info}`);
    return [];
  } catch (error) {
    console.error('      [高德地图] 搜索错误:', error);
    return [];
  }
}

/**
 * 验证地点是否存在（支持模糊搜索和重试）
 */
export async function validateLocation(
  name: string,
  city: string,
  customApiKey?: string
): Promise<{ valid: boolean; poi?: AMapPOI; message?: string }> {
  // 策略1: 精确搜索原始名称
  let pois = await searchPlace(name, city, customApiKey);
  
  if (pois.length > 0) {
    return {
      valid: true,
      poi: pois[0]
    };
  }
  
  // 策略2: 如果精确搜索失败，尝试模糊搜索
  // 去掉常见的后缀词进行二次搜索
  const suffixesToRemove = [
    '景区', '风景区', '旅游区', '公园',
    '夜游', '游船', '游览',
    '美食街', '步行街', '商圈', '广场',
    '纪念馆', '博物馆', '展览馆',
    '店', '馆'
  ];
  
  let fuzzyName = name;
  for (const suffix of suffixesToRemove) {
    if (name.endsWith(suffix)) {
      fuzzyName = name.substring(0, name.length - suffix.length);
      console.log(`      [模糊搜索] 尝试去掉后缀"${suffix}": "${fuzzyName}"`);
      
      // 添加短暂延迟避免API限流
      await sleep(200);
      
      pois = await searchPlace(fuzzyName, city, customApiKey);
      if (pois.length > 0) {
        console.log(`      [模糊搜索] 成功找到: ${pois[0].name}`);
        return {
          valid: true,
          poi: pois[0]
        };
      }
      break; // 只尝试去掉一个后缀
    }
  }
  
  // 策略3: 尝试提取关键词（取前几个字）
  if (name.length > 4) {
    const shortName = name.substring(0, Math.min(4, name.length));
    console.log(`      [模糊搜索] 尝试关键词: "${shortName}"`);
    
    await sleep(200);
    
    pois = await searchPlace(shortName, city, customApiKey);
    if (pois.length > 0) {
      console.log(`      [模糊搜索] 成功找到: ${pois[0].name}`);
      return {
        valid: true,
        poi: pois[0]
      };
    }
  }
  
  return {
    valid: false,
    message: `在城市"${city}"中未找到地点"${name}"。可能原因：1) 地点不存在；2) 地点位于国外（高德地图仅支持中国大陆）；3) 地点名称不准确。建议：请确认地点名称或选择其他地点。`
  };
}

/**
 * 延迟函数，用于避免API限流
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 搜索周边POI
 */
export async function searchNearbyPOI(
  location: string, // 格式：经度,纬度
  types: string,
  radius: number = 1000,
  customApiKey?: string
): Promise<AMapPOI[]> {
  try {
    // 获取API Key（优先使用自定义Key）
    const apiKey = apiKeyManager.getKey('AMAP_WEB_API_KEY', customApiKey);
    
    if (!apiKey) {
      console.error('AMap API Key not configured');
      return [];
    }

    const response = await axios.get<AMapSearchResponse>(
      'https://restapi.amap.com/v3/place/around',
      {
        params: {
          key: apiKey,
          location,
          types,
          radius,
          offset: 20,
          sortrule: 'distance',
        }
      }
    );

    if (response.data.status === '1' && response.data.pois) {
      return response.data.pois;
    }
    
    return [];
  } catch (error) {
    console.error('AMap nearby POI search error:', error);
    return [];
  }
}

/**
 * 获取地点周边的餐饮、景点等
 */
export async function getNearbyRecommendations(
  location: string,
  eventType: string,
  customApiKey?: string
): Promise<AMapPOI[]> {
  // 根据事件类型选择POI类型
  const typeMap: Record<string, string> = {
    'attraction': '110000|120000', // 景点 | 旅游服务
    'restaurant': '050000', // 餐饮
    'entertainment': '080000|090000', // 休闲娱乐 | 生活服务
    'shopping': '060000', // 购物
  };

  const types = typeMap[eventType] || '050000|110000'; // 默认搜索餐饮和景点
  
  return await searchNearbyPOI(location, types, 1000, customApiKey);
}

/**
 * 将location字符串转换为坐标对象
 */
export function parseLocation(location: string): { lng: number; lat: number } | null {
  const parts = location.split(',');
  if (parts.length === 2) {
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!isNaN(lng) && !isNaN(lat)) {
      return { lng, lat };
    }
  }
  return null;
}

/**
 * 路线规划结果
 */
export interface RouteResult {
  distance: number; // 距离（米）
  duration: number; // 时间（秒）
  strategy: string;
  steps?: any[];
  path: Array<{ lng: number; lat: number }>;
}

/**
 * 获取步行路线规划
 */
export async function getWalkingRoute(
  origin: string, // 格式：经度,纬度
  destination: string, // 格式：经度,纬度
  customApiKey?: string
): Promise<RouteResult | null> {
  try {
    const apiKey = apiKeyManager.getKey('AMAP_WEB_API_KEY', customApiKey);
    
    if (!apiKey) {
      console.error('AMap API Key not configured');
      return null;
    }

    console.log(`[高德地图] 步行路线规划: ${origin} -> ${destination}`);

    const response = await axios.get(
      'https://restapi.amap.com/v3/direction/walking',
      {
        params: {
          key: apiKey,
          origin,
          destination,
        }
      }
    );

    if (response.data.status === '1' && response.data.route?.paths?.length > 0) {
      const path = response.data.route.paths[0];
      
      // 解析路径坐标
      const pathCoords: Array<{ lng: number; lat: number }> = [];
      if (path.steps) {
        path.steps.forEach((step: any) => {
          if (step.polyline) {
            const coords = step.polyline.split(';');
            coords.forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(parseFloat);
              if (!isNaN(lng) && !isNaN(lat)) {
                pathCoords.push({ lng, lat });
              }
            });
          }
        });
      }
      
      return {
        distance: parseInt(path.distance),
        duration: parseInt(path.duration),
        strategy: '步行',
        steps: path.steps,
        path: pathCoords,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[高德地图] 步行路线规划错误:', error);
    return null;
  }
}

/**
 * 获取驾车路线规划
 */
export async function getDrivingRoute(
  origin: string,
  destination: string,
  customApiKey?: string
): Promise<RouteResult | null> {
  try {
    const apiKey = apiKeyManager.getKey('AMAP_WEB_API_KEY', customApiKey);
    
    if (!apiKey) {
      console.error('AMap API Key not configured');
      return null;
    }

    console.log(`[高德地图] 驾车路线规划: ${origin} -> ${destination}`);

    const response = await axios.get(
      'https://restapi.amap.com/v3/direction/driving',
      {
        params: {
          key: apiKey,
          origin,
          destination,
          extensions: 'base',
        }
      }
    );

    if (response.data.status === '1' && response.data.route?.paths?.length > 0) {
      const path = response.data.route.paths[0];
      
      // 解析路径坐标
      const pathCoords: Array<{ lng: number; lat: number }> = [];
      if (path.steps) {
        path.steps.forEach((step: any) => {
          if (step.polyline) {
            const coords = step.polyline.split(';');
            coords.forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(parseFloat);
              if (!isNaN(lng) && !isNaN(lat)) {
                pathCoords.push({ lng, lat });
              }
            });
          }
        });
      }
      
      return {
        distance: parseInt(path.distance),
        duration: parseInt(path.duration),
        strategy: '驾车',
        steps: path.steps,
        path: pathCoords,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[高德地图] 驾车路线规划错误:', error);
    return null;
  }
}

/**
 * 获取公交路线规划
 */
export async function getTransitRoute(
  origin: string,
  destination: string,
  city: string,
  customApiKey?: string
): Promise<RouteResult | null> {
  try {
    const apiKey = apiKeyManager.getKey('AMAP_WEB_API_KEY', customApiKey);
    
    if (!apiKey) {
      console.error('AMap API Key not configured');
      return null;
    }

    console.log(`[高德地图] 公交路线规划: ${origin} -> ${destination}`);

    const response = await axios.get(
      'https://restapi.amap.com/v3/direction/transit/integrated',
      {
        params: {
          key: apiKey,
          origin,
          destination,
          city,
          output: 'json',
        }
      }
    );

    if (response.data.status === '1' && response.data.route?.transits?.length > 0) {
      const transit = response.data.route.transits[0];
      
      // 解析路径坐标
      const pathCoords: Array<{ lng: number; lat: number }> = [];
      if (transit.segments) {
        transit.segments.forEach((segment: any) => {
          if (segment.walking?.steps) {
            segment.walking.steps.forEach((step: any) => {
              if (step.polyline) {
                const coords = step.polyline.split(';');
                coords.forEach((coord: string) => {
                  const [lng, lat] = coord.split(',').map(parseFloat);
                  if (!isNaN(lng) && !isNaN(lat)) {
                    pathCoords.push({ lng, lat });
                  }
                });
              }
            });
          }
        });
      }
      
      return {
        distance: parseInt(transit.distance),
        duration: parseInt(transit.duration),
        strategy: '公交',
        steps: transit.segments,
        path: pathCoords,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[高德地图] 公交路线规划错误:', error);
    return null;
  }
}

/**
 * 批量路线规划（多个地点之间）
 */
export async function batchRoutes(
  locations: Array<{ lng: number; lat: number }>,
  mode: 'walking' | 'driving' | 'transit' = 'walking',
  city?: string,
  customApiKey?: string
): Promise<RouteResult[]> {
  const routes: RouteResult[] = [];
  
  for (let i = 0; i < locations.length - 1; i++) {
    const origin = `${locations[i].lng},${locations[i].lat}`;
    const destination = `${locations[i + 1].lng},${locations[i + 1].lat}`;
    
    let route: RouteResult | null = null;
    
    if (mode === 'walking') {
      route = await getWalkingRoute(origin, destination, customApiKey);
    } else if (mode === 'driving') {
      route = await getDrivingRoute(origin, destination, customApiKey);
    } else if (mode === 'transit' && city) {
      route = await getTransitRoute(origin, destination, city, customApiKey);
    }
    
    if (route) {
      routes.push(route);
    }
    
    // 添加延迟避免API限流
    await sleep(300);
  }
  
  return routes;
}

