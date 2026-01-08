import { supabase } from '../db';
import { createListing, getListings, ListingSchema } from '../models/marketplace';
export const listListings = async (req, res) => {
    try {
        const listings = await getListings();
        res.json(listings);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const postListing = async (req, res) => {
    try {
        const data = ListingSchema.parse(req.body);
        const listing = await createListing({ ...data, userId: req.user.id }, req.user.role || 'user');
        res.json(listing);
    }
    catch (err) {
        console.error('Post failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};
export const purchaseListing = async (req, res) => {
    try {
        const { saleId } = req.body;
        const { data, error } = await supabase
            .from('DevicePurchase')
            .insert({
            saleId,
            buyerId: req.user.id,
            status: 'pending',
            price: req.body.price
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error('Purchase failed:', err.message);
        res.status(500).json({ error: 'Purchase failed' });
    }
};
//# sourceMappingURL=marketplace.js.map