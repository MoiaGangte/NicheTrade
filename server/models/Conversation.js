import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    lastMessageText: { type: String, default: '' },
    lastMessageType: { type: String, enum: ['text', 'order'], default: 'text' },
    lastMessageAt: { type: Date, default: Date.now },
    buyerUnreadCount: { type: Number, default: 0, min: 0 },
    sellerUnreadCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

conversationSchema.index({ buyerId: 1, sellerId: 1, productId: 1 }, { unique: true });
conversationSchema.index({ buyerId: 1, lastMessageAt: -1 });
conversationSchema.index({ sellerId: 1, lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
