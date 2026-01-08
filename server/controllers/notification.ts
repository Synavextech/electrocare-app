import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getUserById } from '../models/user';

const transporter = nodemailer.createTransport({ /* same as auth */ });

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, subject, message } = req.body;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await transporter.sendMail({ to: user.email, subject, text: message });
    res.json({ success: true });
  } catch (err) {
    console.error('Notification failed:', (err as Error).message);
    res.status(500).json({ error: 'Notification failed' });
  }
};
// Integrate with WebSockets in server.ts for real-time