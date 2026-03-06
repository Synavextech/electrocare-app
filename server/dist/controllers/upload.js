import { supabase } from '../db';
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const folder = req.body.folder || 'marketplace';
        const bucket = req.body.bucket || 'device-media';
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            console.error('Supabase Storage Error:', JSON.stringify(error, null, 2));
            throw error;
        }
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
        res.json({ imageUrl: publicUrl, path: filePath });
    }
    catch (err) {
        console.error('Upload failed details:', err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
};
//# sourceMappingURL=upload.js.map