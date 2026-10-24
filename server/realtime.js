import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from './models/User.js';
import Conversation from './models/Conversation.js';

let io;
const userSockets = new Map();

const userRoom = (userId) => `user:${userId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;
const idOf = (reference) => (reference?._id || reference).toString();

export const initializeRealtime = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error('Not allowed by Socket.IO CORS'));
            },
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== 'string' || !token) {
                return next(new Error('Authentication required'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id');
            if (!user) return next(new Error('Authentication required'));
            socket.data.userId = user._id.toString();
            next();
        } catch {
            next(new Error('Authentication required'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        const sockets = userSockets.get(userId) || new Set();
        const wasOnline = sockets.size > 0;
        sockets.add(socket.id);
        userSockets.set(userId, sockets);
        socket.join(userRoom(userId));

        if (!wasOnline) {
            socket.broadcast.emit('presence:changed', { userId, online: true });
        }

        socket.on('conversation:join', async (payload, acknowledge) => {
            const respond = (result) => {
                if (typeof acknowledge === 'function') acknowledge(result);
            };
            try {
                const conversationId = payload?.conversationId;
                if (!mongoose.isValidObjectId(conversationId)) {
                    return respond({ success: false, message: 'Invalid conversation' });
                }
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    $or: [{ buyerId: userId }, { sellerId: userId }],
                });
                if (!conversation) {
                    return acknowledge?.({ success: false, message: 'Conversation not found' });
                }

                const room = conversationRoom(conversationId);
                socket.join(room);
                const otherUserId = idOf(conversation.buyerId) === userId
                    ? idOf(conversation.sellerId)
                    : idOf(conversation.buyerId);
                socket.emit('presence:status', {
                    conversationId,
                    userId: otherUserId,
                    online: Boolean(userSockets.get(otherUserId)?.size),
                });
                respond({ success: true });
            } catch (error) {
                console.error('Unable to join chat room:', error);
                respond({ success: false, message: 'Unable to join conversation' });
            }
        });

        socket.on('conversation:leave', (payload) => {
            const conversationId = payload?.conversationId;
            if (typeof conversationId !== 'string') return;
            socket.leave(conversationRoom(conversationId));
        });

        socket.on('disconnect', () => {
            const active = userSockets.get(userId);
            active?.delete(socket.id);
            if (active?.size === 0) {
                userSockets.delete(userId);
                socket.broadcast.emit('presence:changed', { userId, online: false });
            }
        });
    });

    return io;
};

export const publishMessage = (conversation, message) => {
    if (!io) return;
    const payload = { ...message, conversationId: conversation._id };
    io.to(conversationRoom(conversation._id.toString()))
        .to(userRoom(idOf(conversation.buyerId)))
        .to(userRoom(idOf(conversation.sellerId)))
        .emit('message:new', payload);
    io.to(userRoom(idOf(conversation.buyerId))).emit('conversation:updated', { conversationId: conversation._id });
    io.to(userRoom(idOf(conversation.sellerId))).emit('conversation:updated', { conversationId: conversation._id });
};

export const publishConversationUpdate = (conversation) => {
    if (!io) return;
    io.to(userRoom(idOf(conversation.buyerId))).emit('conversation:updated', { conversationId: conversation._id });
    io.to(userRoom(idOf(conversation.sellerId))).emit('conversation:updated', { conversationId: conversation._id });
};

export const publishConversationRead = (conversation, readerId, readAt) => {
    if (!io) return;
    io.to(conversationRoom(conversation._id.toString())).emit('messages:read', {
        conversationId: conversation._id,
        readerId,
        readAt,
    });
};
