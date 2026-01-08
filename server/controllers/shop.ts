import { Request, Response } from 'express';
import { getNearbyShops, getShops, createShop, ShopSchema } from '../models/shop';

export const listShops = async (req: Request, res: Response) => {
  try {
    const shops = await getShops();
    res.json(shops);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getNearby = async (req: Request, res: Response) => {
  try {
    const { location } = req.query;
    const shops = await getNearbyShops(location as string);
    res.json(shops);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const registerShop = async (req: Request, res: Response) => {
  try {
    // Assuming admin check is done in middleware
    const data = ShopSchema.parse(req.body);
    const shop = await createShop(data);
    res.json(shop);
  } catch (err) {
    console.error('Registration failed:', (err as Error).message);
    res.status(500).json({ error: 'Registration failed' });
  }
};