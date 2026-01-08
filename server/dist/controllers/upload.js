import { supabase } from '../db';
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `marketplace/${fileName}`;
        const { data, error } = await supabase.storage
            .from('device-media')
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error)
            throw error;
        const { data: { publicUrl } } = supabase.storage
            .from('device-media')
            .getPublicUrl(filePath);
        res.json({ imageUrl: publicUrl });
    }
    catch (err) {
        console.error('Upload failed:', err.message);
        res.status(500).json({ error: 'Upload failed' });
    }
};
//# sourceMappingURL=upload.js.map