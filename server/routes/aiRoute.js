import express from 'express';
import { chatWithAi } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/chat', chatWithAi);

export default aiRouter;
