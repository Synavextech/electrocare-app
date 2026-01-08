import { supabase } from '../db';
export default async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Fetch user role from public.User table
        const { data: profile } = await supabase
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