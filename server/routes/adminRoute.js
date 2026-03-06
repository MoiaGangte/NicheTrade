import express from 'express';
import { sendTestEmail } from '../controllers/adminController.js';

const router = express.Router();

router.post('/test-email', sendTestEmail);

export default router;
