import { Request, Response } from 'express';
import { getNearbyShops, getShops, createShop, updateShopStatus, updateShopConfig, ShopSchema } from '../models/shop.js';

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
    const { location, lat, lng, radius } = req.query;
    const shops = await getNearbyShops({
      location: location ? String(location) : undefined,
      lat: lat !== undefined ? parseFloat(String(lat)) : undefined,
      lng: lng !== undefined ? parseFloat(String(lng)) : undefined,
      radiusKm: radius !== undefined ? parseFloat(String(radius)) : undefined,
    });
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

export const updateServices = async (req: Request, res: Response) => {
  try {
    const { shopCode } = req.params;
    const { services } = req.body;
    if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'Services must be an array of strings' });
    }
    const { updateShopServices } = await import('../models/shop.js');
    const updated = await updateShopServices(shopCode, services);
    res.json(updated);
  } catch (err) {
    console.error('Update services failed:', (err as Error).message);
    res.status(500).json({ error: 'Update services failed' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, statusNote } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'Status is required and must be a string' });
    }
    const updated = await updateShopStatus(id, status.trim(), statusNote);
    res.json(updated);
  } catch (err) {
    console.error('Update status failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to update shop status' });
  }
};

export const configureShop = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateShopConfig(id, updates);
    res.json(updated);
  } catch (err) {
    console.error('Configure shop failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to configure shop' });
  }
};

export const getMyShop = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'shop' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email || '';

    // 1. Try finding by userId
    const { supabase } = await import('../db.js');
    let { data: shop } = await supabase
      .from('Shops')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    // 2. If not found, try matching by email or shopCode pattern in email (e.g. shop.nbo-westlands@...)
    if (!shop && userEmail) {
      const match = userEmail.match(/shop\.([^@]+)@/i);
      const codeCandidate = match ? match[1].toUpperCase() : '';
      if (codeCandidate) {
        const { data: matchedShop } = await supabase
          .from('Shops')
          .select('*')
          .ilike('shopCode', `%${codeCandidate}%`)
          .maybeSingle();
        if (matchedShop) shop = matchedShop;
      }
    }

    // 3. Fallback: if user role is shop, return the first shop
    if (!shop) {
      const { data: fallbackShop } = await supabase
        .from('Shops')
        .select('*')
        .order('name', { ascending: true })
        .limit(1)
        .maybeSingle();
      shop = fallbackShop;
    }

    if (!shop) {
      return res.status(404).json({ error: 'Shop profile not found' });
    }

    res.json(shop);
  } catch (err) {
    console.error('getMyShop error:', err);
    res.status(500).json({ error: 'Failed to retrieve shop profile' });
  }
};