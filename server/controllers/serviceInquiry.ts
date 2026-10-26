import { Request, Response } from 'express';
import {
  createServiceInquiry,
  getServiceInquiries,
  getServiceInquiryById,
  updateServiceInquiryStatus,
  ServiceInquirySchema,
} from '../models/serviceInquiry.js';
import { io } from '../socket.js';

export const submitInquiry = async (req: Request, res: Response) => {
  try {
    const validatedData = ServiceInquirySchema.parse(req.body);
    const userId = req.user?.id || null;

    const newInquiry = await createServiceInquiry(userId, validatedData);

    // Broadcast live event to connected admin channels
    try {
      if (io) {
        io.emit('new_service_inquiry', {
          id: newInquiry.id,
          serviceType: newInquiry.serviceType,
          clientName: newInquiry.clientName,
          targetEntity: newInquiry.targetEntity,
          createdAt: newInquiry.createdAt,
        });
      }
    } catch (wsErr) {
      console.warn('WebSocket broadcast error (non-fatal):', wsErr);
    }

    res.status(201).json({
      success: true,
      message: 'Service inquiry submitted successfully. Our engineering team will review and contact you shortly.',
      inquiry: newInquiry,
    });
  } catch (err: any) {
    console.error('Submit service inquiry error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to submit service inquiry' });
  }
};

export const listInquiries = async (req: Request, res: Response) => {
  try {
    const { serviceType, status, my } = req.query;
    const isUserAdmin = req.user?.role === 'admin';
    const filterUserId = (my === 'true' || !isUserAdmin) ? req.user?.id : undefined;

    const inquiries = await getServiceInquiries({
      serviceType: serviceType as string,
      status: status as string,
      userId: filterUserId,
    });

    res.json(inquiries);
  } catch (err: any) {
    console.error('List service inquiries error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve service inquiries' });
  }
};

export const getInquiryDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquiry = await getServiceInquiryById(id);

    if (!inquiry) {
      return res.status(404).json({ error: 'Service inquiry not found' });
    }

    // Role check: Admin or inquiry owner
    if (req.user?.role !== 'admin' && inquiry.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(inquiry);
  } catch (err: any) {
    console.error('Get service inquiry error:', err.message);
    res.status(500).json({ error: 'Failed to fetch inquiry details' });
  }
};

export const updateInquiry = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updated = await updateServiceInquiryStatus(id, status, notes);
    res.json(updated);
  } catch (err: any) {
    console.error('Update service inquiry error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to update service inquiry' });
  }
};
