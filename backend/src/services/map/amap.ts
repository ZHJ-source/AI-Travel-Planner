import axios from 'axios';
import { ENV } from '../../config/env';
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

    if (response.data.status === '1' && response.data.pois) {
      return response.data.pois;
    }
    
    return [];
  } catch (error) {
    console.error('AMap search error:', error);
    return [];
  }
}

/**
 * 验证地点是否存在
 */
export async function validateLocation(
  name: string,
  city: string,
  customApiKey?: string
): Promise<{ valid: boolean; poi?: AMapPOI }> {
  const pois = await searchPlace(name, city, customApiKey);
  
  if (pois.length > 0) {
    return {
      valid: true,
      poi: pois[0]
    };
  }
  
  return {
    valid: false
  };
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

