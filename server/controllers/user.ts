import { Request, Response } from 'express';
import { supabase } from '../db.js';

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get count of repairs
    const { count: repairsCount } = await supabase
      .from('RepairRequest')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    // Get count of marketplace listings
    const { count: listingsCount } = await supabase
      .from('DeviceSale')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    // Get wallet details
    const { data: wallet } = await supabase
      .from('Wallet')
      .select('balance, points')
      .eq('userId', userId)
      .single();

    res.json({
      repairs: repairsCount || 0,
      listings: listingsCount || 0,
      balance: wallet?.balance || 0,
      points: wallet?.points || 0
    });
  } catch (err) {
    console.error('Fetch user stats failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
