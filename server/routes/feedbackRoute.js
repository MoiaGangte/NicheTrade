import express from 'express';
import { sendFeedbackEmail } from '../controllers/feedbackController.js';

const feedbackRouter = express.Router();

feedbackRouter.post('/send', sendFeedbackEmail);

export default feedbackRouter;