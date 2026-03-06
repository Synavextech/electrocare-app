import nodemailer from 'nodemailer';
import { supabase } from '../db';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
export const sendNotification = async (req, res) => {
    try {
        const { userId, subject, message } = req.body;
        const { data: user } = await supabase.from('User').select('email').eq('id', userId).single();
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
export const broadcastNotification = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { subject, message } = req.body;
        const { data: users, error } = await supabase.from('User').select('email');
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
//# sourceMappingURL=notification.js.map