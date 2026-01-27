import express from 'express';
import authMiddleware from '../middleware/auth';
import { createApplication } from '../models/roleApplication';

const router = express.Router();
router.use(authMiddleware);

router.post('/apply-technician', async (req: express.Request, res: express.Response) => {
  try {
    if (req.user?.role !== 'user') return res.status(403).json({ error: 'Only regular users can apply for professional roles' });

    await createApplication({
      userId: req.user.id,
      requestedRole: 'technician',
      status: 'pending',
      documents: req.body.documents || [],
      notes: req.body.notes || ''
    });

    res.json({ success: true, message: 'Technician application submitted for review' });
  } catch (err) {
    console.error('Technician application error:', err);
    res.status(500).json({ error: 'Application failed' });
  }
});

router.post('/apply-delivery', async (req: express.Request, res: express.Response) => {
  try {
    if (req.user?.role !== 'user') return res.status(403).json({ error: 'Only regular users can apply for professional roles' });

    await createApplication({
      userId: req.user.id,
      requestedRole: 'delivery',
      status: 'pending',
      documents: req.body.documents || [],
      notes: req.body.notes || ''
    });

    res.json({ success: true, message: 'Delivery personnel application submitted for review' });
  } catch (err) {
    console.error('Delivery application error:', err);
    res.status(500).json({ error: 'Application failed' });
  }
});

export default router;