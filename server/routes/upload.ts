import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

router.post('/', upload.single('image'), uploadImage);

export default router;
