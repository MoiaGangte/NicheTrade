import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import {
    createAndPublishMessage,
    createOrFindConversation,
    getParticipantConversation,
    getUserConversations,
} from '../services/chatService.js';
import { publishConversationRead } from '../realtime.js';
import { publishConversationUpdate } from '../realtime.js';

const markConversationRead = async (conversation, userId) => {
    const unreadField = conversation.buyerId.toString() === userId.toString()
        ? 'buyerUnreadCount'
        : 'sellerUnreadCount';
    const readAt = new Date();
    await Promise.all([
        Message.updateMany({
            conversationId: conversation._id,
            senderId: { $ne: userId },
            readAt: null,
        }, { $set: { readAt } }),
        Conversation.updateOne({ _id: conversation._id }, { $set: { [unreadField]: 0 } }),
    ]);
    publishConversationRead(conversation, userId, readAt);
    publishConversationUpdate(conversation);
    return readAt;
};

export const listConversations = async (req, res) => {
    try {
        const conversations = await getUserConversations(req.userId);
        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Unable to list conversations:', error);
        res.status(500).json({ success: false, message: 'Unable to load conversations' });
    }
};

export const startConversation = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ success: false, message: 'A valid product is required' });
        }

        const conversation = await createOrFindConversation(req.userId, productId);
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Unable to start conversation:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Unable to start conversation',
        });
    }
};

export const listMessages = async (req, res) => {
    try {
        const conversation = await getParticipantConversation(req.params.conversationId, req.userId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 100);
        await markConversationRead(conversation, req.userId);
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate({ path: 'senderId', select: 'name' })
            .lean();

        res.json({
            success: true,
            conversation: {
                _id: conversation._id,
            },
            messages: messages.reverse(),
        });
    } catch (error) {
        console.error('Unable to load conversation messages:', error);
        res.status(500).json({ success: false, message: 'Unable to load messages' });
    }
};

export const markMessagesRead = async (req, res) => {
    try {
        const conversation = await getParticipantConversation(req.params.conversationId, req.userId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }
        await markConversationRead(conversation, req.userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Unable to mark messages as read:', error);
        res.status(500).json({ success: false, message: 'Unable to update read status' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string' || !content.trim() || content.trim().length > 2000) {
            return res.status(400).json({ success: false, message: 'Message must be between 1 and 2000 characters' });
        }

        const conversation = await getParticipantConversation(req.params.conversationId, req.userId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const message = await createAndPublishMessage({
            conversation,
            senderId: req.userId,
            type: 'text',
            content: content.trim(),
        });
        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Unable to send message:', error);
        res.status(500).json({ success: false, message: 'Unable to send message' });
    }
};

export const getUnreadMessageCount = async (req, res) => {
    try {
        const result = await Conversation.aggregate([
            { $match: { $or: [{ buyerId: req.userId }, { sellerId: req.userId }] } },
            {
                $group: {
                    _id: null,
                    buyerUnread: {
                        $sum: { $cond: [{ $eq: ['$buyerId', req.userId] }, '$buyerUnreadCount', 0] },
                    },
                    sellerUnread: {
                        $sum: { $cond: [{ $eq: ['$sellerId', req.userId] }, '$sellerUnreadCount', 0] },
                    },
                },
            },
        ]);
        const counts = result[0] || { buyerUnread: 0, sellerUnread: 0 };
        res.json({
            success: true,
            unreadCount: counts.buyerUnread + counts.sellerUnread,
        });
    } catch (error) {
        console.error('Unable to load unread message count:', error);
        res.status(500).json({ success: false, message: 'Unable to load unread messages' });
    }
};
