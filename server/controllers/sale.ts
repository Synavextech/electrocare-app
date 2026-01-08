import { Request, Response } from 'express';
import { createSale, getSalesByUser, SaleSchema } from '../models/sale';

export const createDeviceSale = async (req: Request, res: Response) => {
  try {
    const data = SaleSchema.parse(req.body);
    const sale = await createSale({ ...data, userId: req.user!.id });
    res.json(sale);
  } catch (err) {
    console.error('Sale creation failed:', (err as Error).message);
    res.status(500).json({ error: 'Sale creation failed' });
  }
};

export const getMySales = async (req: Request, res: Response) => {
  try {
    const sales = await getSalesByUser(req.user!.id);
    res.json(sales);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};
// Approval in admin controller