import { Router, Request, Response } from 'express';
import { 
  searchPlace, 
  validateLocation, 
  searchNearbyPOI,
  getWalkingRoute,
  getDrivingRoute,
  getTransitRoute,
  batchRoutes
} from '../services/map/amap';

const router = Router();

/**
 * 搜索地点
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { keywords, city } = req.body;
    
    if (!keywords || !city) {
      res.status(400).json({ error: 'Keywords and city are required' });
      return;
    }
    
    const pois = await searchPlace(keywords, city);
    
    res.json({ pois });
  } catch (error) {
    console.error('Search location error:', error);
    res.status(500).json({ error: 'Failed to search location' });
  }
});

/**
 * 验证地点是否存在
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { name, city } = req.body;
    
    if (!name || !city) {
      res.status(400).json({ error: 'Name and city are required' });
      return;
    }
    
    const result = await validateLocation(name, city);
    
    res.json(result);
  } catch (error) {
    console.error('Validate location error:', error);
    res.status(500).json({ error: 'Failed to validate location' });
  }
});

/**
 * 获取周边POI
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { location, types, radius } = req.query;
    
    if (!location || !types) {
      res.status(400).json({ error: 'Location and types are required' });
      return;
    }
    
    const pois = await searchNearbyPOI(
      location as string,
      types as string,
      radius ? parseInt(radius as string) : 1000
    );
    
    res.json({ pois });
  } catch (error) {
    console.error('Get nearby POI error:', error);
    res.status(500).json({ error: 'Failed to get nearby POI' });
  }
});

/**
 * 路线规划
 */
router.post('/route', async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode, city } = req.body;
    
    if (!origin || !destination) {
      res.status(400).json({ error: 'Origin and destination are required' });
      return;
    }
    
    let route;
    
    if (mode === 'driving') {
      route = await getDrivingRoute(origin, destination);
    } else if (mode === 'transit') {
      if (!city) {
        res.status(400).json({ error: 'City is required for transit mode' });
        return;
      }
      route = await getTransitRoute(origin, destination, city);
    } else {
      route = await getWalkingRoute(origin, destination);
    }
    
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    res.json({ route });
  } catch (error) {
    console.error('Route planning error:', error);
    res.status(500).json({ error: 'Failed to plan route' });
  }
});

/**
 * 批量路线规划
 */
router.post('/routes/batch', async (req: Request, res: Response) => {
  try {
    const { locations, mode, city } = req.body;
    
    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      res.status(400).json({ error: 'At least 2 locations are required' });
      return;
    }
    
    if (mode === 'transit' && !city) {
      res.status(400).json({ error: 'City is required for transit mode' });
      return;
    }
    
    const routes = await batchRoutes(locations, mode || 'walking', city);
    
    res.json({ routes });
  } catch (error) {
    console.error('Batch route planning error:', error);
    res.status(500).json({ error: 'Failed to plan routes' });
  }
});

export default router;

