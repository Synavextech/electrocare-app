import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createApplication } from '../models/roleApplication.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/apply-technician', async (req: express.Request, res: express.Response) => {
  try {
    if (req.user?.role !== 'user') return res.status(403).json({ error: 'Only regular users can apply for professional roles' });

    await createApplication({
      userId: req.user.id,
      requestedRole: 'technician',
      status: 'pending',
      phone: req.body.phone || null,
      shopId: req.body.shopId || null,
      locality: req.body.locality || null,
      preferredDevices: Array.isArray(req.body.preferredDevices) ? req.body.preferredDevices : (req.body.preferredDevices ? [req.body.preferredDevices] : []),
      proficiency: Array.isArray(req.body.proficiency) ? req.body.proficiency : (req.body.proficiency ? [req.body.proficiency] : []),
      experienceLevel: req.body.experienceLevel || null,
      documents: req.body.documents || [],
      notes: req.body.notes || ''
    });

    res.json({ success: true, message: 'Technician application submitted for review' });
  } catch (err) {
    console.error('Technician application error:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Application failed' });
  }
});

router.post('/apply-delivery', async (req: express.Request, res: express.Response) => {
  try {
    if (req.user?.role !== 'user') return res.status(403).json({ error: 'Only regular users can apply for professional roles' });

    await createApplication({
      userId: req.user.id,
      requestedRole: 'delivery',
      status: 'pending',
      phone: req.body.phone || null,
      shopId: req.body.shopId || null,
      locality: req.body.locality || null,
      vehicleType: req.body.vehicleType || null,
      deliveryFrequency: req.body.deliveryFrequency || null,
      documents: req.body.documents || [],
      notes: req.body.notes || ''
    });

    res.json({ success: true, message: 'Delivery personnel application submitted for review' });
  } catch (err) {
    console.error('Delivery application error:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Application failed' });
  }
});

export default router;