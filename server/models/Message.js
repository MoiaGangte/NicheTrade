import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    type: { type: String, enum: ['text', 'order'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    readAt: { type: Date, default: null },
}, { timestamps: true });

messageSchema.index({ conversationId:  1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
