import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product' },
        quantity: { type: Number, required: true }
    }],
    amount: { type: Number, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'address' },
    status: { type: String, default: 'Order Placed' },
    paymentType: { type: String, required: true },
    paymentId: { type: String, required: false },
    razorpayOrderId: { type: String, required: false },
    isPaid: { type: Boolean, required: true, default: false },
    isHidden: { type: Boolean, default: false },
}, { timestamps: true })


const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)

export default Order