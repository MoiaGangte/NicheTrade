import mongoose from "mongoose";

const sellerSubscriptionSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    plan: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "active"], default: "pending" },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

const SellerSubscription = mongoose.models.SellerSubscription
    || mongoose.model("SellerSubscription", sellerSubscriptionSchema);

export default SellerSubscription;
