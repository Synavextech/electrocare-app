"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseListing = exports.postListing = exports.listListings = void 0;
const db_1 = require("../db");
const marketplace_1 = require("../models/marketplace");
const listListings = async (req, res) => {
    try {
        const listings = await (0, marketplace_1.getListings)();
        res.json(listings);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.listListings = listListings;
const postListing = async (req, res) => {
    try {
        const data = marketplace_1.ListingSchema.parse(req.body);
        const listing = await (0, marketplace_1.createListing)({ ...data, userId: req.user.id }, req.user.role || 'user');
        res.json(listing);
    }
    catch (err) {
        console.error('Post failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.postListing = postListing;
const purchaseListing = async (req, res) => {
    try {
        const { saleId } = req.body;
        const { data, error } = await db_1.supabase
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
exports.purchaseListing = purchaseListing;
//# sourceMappingURL=marketplace.js.map