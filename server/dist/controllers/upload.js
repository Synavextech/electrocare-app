"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const db_1 = require("../db");
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `marketplace/${fileName}`;
        const { data, error } = await db_1.supabase.storage
            .from('device-media')
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            console.error('Supabase Storage Error:', JSON.stringify(error, null, 2));
            throw error;
        }
        const { data: { publicUrl } } = db_1.supabase.storage
            .from('device-media')
            .getPublicUrl(filePath);
        res.json({ imageUrl: publicUrl });
    }
    catch (err) {
        console.error('Upload failed details:', err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=upload.js.map