import express from 'express';
import { authUser } from '../middleware/authMiddleware.js';
import {
    getUnreadMessageCount,
    listConversations,
    listMessages,
    markMessagesRead,
    sendMessage,
    startConversation,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(authUser);
router.get('/unread-count', getUnreadMessageCount);
router.get('/conversations', listConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:conversationId/messages', listMessages);
router.patch('/conversations/:conversationId/read', markMessagesRead);
router.post('/conversations/:conversationId/messages', sendMessage);

export default router;
