import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product' },
        quantity: { type: Number, required: true }
    }],
    amount: { type: Number, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'address' },
    deliveryLocation: { type: String, enum: ['AFC', 'Near Department Store', 'MBA Canteen', 'Cafe Canteen', 'Other'] },
    customDeliveryLocation: { type: String, default: '' },
    deliveryTime: { type: String, enum: ['During lunch break', 'After college', 'Other'] },
    customDeliveryTime: { type: String, default: '' },
    status: { type: String, default: 'Order Placed' },
    paymentType: { type: String },
    paymentId: { type: String, required: false },
    razorpayOrderId: { type: String, required: false },
    isPaid: { type: Boolean, required: true, default: false },
    isHidden: { type: Boolean, default: false },
}, { timestamps: true })


const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)

export default Order