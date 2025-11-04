import api from './api';

export interface POI {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: string;
  distance?: string;
  tel?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  strategy: string;
  path: Array<{ lng: number; lat: number }>;
}

/**
 * 搜索地点
 */
export async function searchLocation(keywords: string, city: string): Promise<POI[]> {
  const response = await api.post('/api/location/search', { keywords, city });
  return response.data.pois || [];
}

/**
 * 获取路线规划
 */
export async function getRoute(
  origin: string,
  destination: string,
  mode: 'walking' | 'driving' = 'walking'
): Promise<RouteInfo | null> {
  try {
    const response = await api.post('/api/location/route', {
      origin,
      destination,
      mode,
    });
    return response.data.route;
  } catch (error) {
    console.error('Failed to get route:', error);
    return null;
  }
}

/**
 * 批量路线规划
 */
export async function batchRoutes(
  locations: Array<{ lng: number; lat: number }>,
  mode: 'walking' | 'driving' = 'walking'
): Promise<RouteInfo[]> {
  try {
    const response = await api.post('/api/location/routes/batch', {
      locations,
      mode,
    });
    return response.data.routes || [];
  } catch (error) {
    console.error('Failed to get batch routes:', error);
    return [];
  }
}

