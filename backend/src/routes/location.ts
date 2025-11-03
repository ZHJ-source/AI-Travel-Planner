import { Router, Request, Response } from 'express';
import { searchPlace, validateLocation, searchNearbyPOI } from '../services/map/amap';

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

export default router;

