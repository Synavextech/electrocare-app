"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = exports.sendNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = require("../db");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const sendNotification = async (req, res) => {
    try {
        const { userId, subject, message } = req.body;
        const { data: user } = await db_1.supabase.from('User').select('email').eq('id', userId).single();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        await transporter.sendMail({ to: user.email, subject, text: message });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Notification failed:', err.message);
        res.status(500).json({ error: 'Notification failed' });
    }
};
exports.sendNotification = sendNotification;
const broadcastNotification = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { subject, message } = req.body;
        const { data: users, error } = await db_1.supabase.from('User').select('email');
        if (error)
            throw error;
        const emails = users.map(u => u.email).filter(Boolean);
        // Send emails in chunks to avoid rate limiting
        for (let i = 0; i < emails.length; i += 10) {
            const chunk = emails.slice(i, i + 10);
            await Promise.all(chunk.map(email => transporter.sendMail({ to: email, subject, text: message }).catch((err) => console.error(`Failed to send to ${email}:`, err.message))));
        }
        res.json({ success: true, count: emails.length });
    }
    catch (err) {
        console.error('Broadcast failed:', err.message);
        res.status(500).json({ error: 'Broadcast failed' });
    }
};
exports.broadcastNotification = broadcastNotification;
//# sourceMappingURL=notification.js.map