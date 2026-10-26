import { Request, Response } from 'express';
import {
  createCustomRequest,
  getCustomRequests,
  getCustomRequestById,
  createCustomOffer,
  acceptCustomOffer,
  CustomRequestSchema,
  CustomOfferSchema,
} from '../models/customRequest.js';

export const listCustomRequests = async (req: Request, res: Response) => {
  try {
    const { category, my, status } = req.query;
    const userId = my === 'true' ? req.user?.id : undefined;

    const requests = await getCustomRequests({
      category: category as string,
      userId,
      status: status as string,
    });

    res.json(requests);
  } catch (err: any) {
    console.error('List custom requests error:', err.message);
    res.status(500).json({ error: 'Failed to fetch custom requests' });
  }
};

export const postCustomRequest = async (req: Request, res: Response) => {
  try {
    const data = CustomRequestSchema.parse(req.body);
    const newRequest = await createCustomRequest(req.user!.id, data);
    res.json(newRequest);
  } catch (err: any) {
    console.error('Create custom request error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to create request' });
  }
};

export const getCustomRequestDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await getCustomRequestById(id);
    res.json(request);
  } catch (err: any) {
    console.error('Get custom request error:', err.message);
    res.status(404).json({ error: 'Custom request not found' });
  }
};

export const submitCustomOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // requestId
    const data = CustomOfferSchema.parse(req.body);

    const offer = await createCustomOffer(id, req.user!.id, data);
    res.json(offer);
  } catch (err: any) {
    console.error('Submit offer error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit offer' });
  }
};

export const acceptOffer = async (req: Request, res: Response) => {
  try {
    const { id, offerId } = req.params;
    const updated = await acceptCustomOffer(id, offerId, req.user!.id);
    res.json({
      success: true,
      message: 'Offer accepted! The seller has been notified to proceed.',
      request: updated,
    });
  } catch (err: any) {
    console.error('Accept offer error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to accept offer' });
  }
};
