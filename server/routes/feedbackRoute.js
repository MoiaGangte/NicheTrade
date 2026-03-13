import express from 'express';
import { sendFeedbackEmail } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/send', sendFeedbackEmail);

export default router;