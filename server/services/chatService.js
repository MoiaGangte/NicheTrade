import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import { publishConversationUpdate, publishMessage } from '../realtime.js';

const participantQuery = (userId) => ({ $or: [{ buyerId: userId }, { sellerId: userId }] });
const idOf = (reference) => (reference?._id || reference).toString();

export const unreadCountFor = (conversation, userId) => (
    idOf(conversation.buyerId) === userId.toString()
        ? conversation.buyerUnreadCount
        : conversation.sellerUnreadCount
);

export const createOrFindConversation = async (buyerId, productId) => {
    const product = await Product.findById(productId).select('_id name sellerId');
    if (!product || !product.sellerId) {
        const error = new Error('This listing does not have an active seller to message');
        error.status = 404;
        throw error;
    }

    const seller = await Seller.findById(product.sellerId).select('userId isApproved isActive');
    if (!seller?.userId || !seller.isApproved || seller.isActive === false) {
        const error = new Error('The seller for this listing is unavailable');
        error.status = 404;
        throw error;
    }
    if (seller.userId.toString() === buyerId.toString()) {
        const error = new Error('You cannot message yourself about your own listing');
        error.status = 400;
        throw error;
    }

    const filter = { buyerId, sellerId: seller.userId, productId: product._id };
    let conversation;
    try {
        conversation = await Conversation.findOneAndUpdate(
            filter,
            { $setOnInsert: { ...filter, lastMessageAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne(filter);
        if (!conversation) throw error;
    }

    await conversation.populate([
        { path: 'buyerId', select: 'name' },
        { path: 'sellerId', select: 'name' },
        { path: 'productId', select: 'name image offerPrice price' },
    ]);
    publishConversationUpdate(conversation);
    return conversation;
};

export const createAndPublishMessage = async ({
    conversation,
    senderId = null,
    type,
    content,
    orderId = null,
}) => {
    const message = await Message.create({
        conversationId: conversation._id,
        senderId,
        type,
        content,
        orderId,
    });

    const unreadField = senderId
        ? (idOf(conversation.buyerId) === senderId.toString() ? 'sellerUnreadCount' : 'buyerUnreadCount')
        : 'sellerUnreadCount';

    await Conversation.updateOne(
        { _id: conversation._id },
        {
            $set: {
                lastMessageText: content,
                lastMessageType: type,
                lastMessageAt: message.createdAt,
            },
            $inc: { [unreadField]: 1 },
        },
    );

    await message.populate({ path: 'senderId', select: 'name' });
    const payload = message.toObject();
    publishMessage(conversation, payload);
    return payload;
};

export const createOrderChatMessages = async (order) => {
    const messages = [];
    for (const item of order.items) {
        const productId = item.product?._id || item.product;
        if (!mongoose.isValidObjectId(productId)) continue;
        const product = await Product.findById(productId).select('_id name sellerId');
        if (!product?.sellerId) continue;
        const seller = await Seller.findById(product.sellerId).select('userId isApproved isActive');
        if (!seller?.userId || !seller.isApproved || seller.isActive === false) continue;
        if (seller.userId.toString() === order.userId.toString()) continue;

        const conversation = await createOrFindConversation(order.userId, product._id);
        const content = `Order placed: ${item.quantity} × ${product.name}.`;
        const message = await createAndPublishMessage({
            conversation,
            type: 'order',
            content,
            orderId: order._id,
        });
        messages.push(message);
    }
    return messages;
};

export const getUserConversations = async (userId) => {
    const conversations = await Conversation.find(participantQuery(userId))
        .populate({ path: 'buyerId', select: 'name' })
        .populate({ path: 'sellerId', select: 'name' })
        .populate({ path: 'productId', select: 'name image offerPrice price category' })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

    return conversations.map((conversation) => ({
        ...conversation,
        unreadCount: unreadCountFor(conversation, userId),
        otherUser: idOf(conversation.buyerId) === userId.toString()
            ? conversation.sellerId
            : conversation.buyerId,
    }));
};

export const getParticipantConversation = async (conversationId, userId) => {
    if (!mongoose.isValidObjectId(conversationId)) return null;
    const conversation = await Conversation.findOne({
        _id: conversationId,
        ...participantQuery(userId),
    });
    return conversation;
};
