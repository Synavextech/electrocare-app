"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
const db_1 = require("../db");
async function authMiddleware(req, res, next) {
    let token = req.cookies?.access_token;
    if (!token) {
        token = req.headers.authorization?.split(' ')[1];
    }
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { data: { user }, error } = await db_1.supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Fetch user role from public.User table
        const { data: profile } = await db_1.supabase
            .from('User')
            .select('role')
            .eq('id', user.id)
            .single();
        req.user = {
            id: user.id,
            role: profile?.role || 'user',
            email: user.email
        };
        next();
    }
    catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
//# sourceMappingURL=auth.js.map