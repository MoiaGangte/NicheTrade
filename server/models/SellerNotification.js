import mongoose from "mongoose";

const sellerNotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: false },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: ["seller_suspended", "seller_banned", "seller_restored", "lost_found_claim"], required: true },
    readAt: { type: Date, default: null },
}, { timestamps: true });

sellerNotificationSchema.index({ userId: 1, createdAt: -1 });
sellerNotificationSchema.index({ userId: 1, readAt: 1 });

export default mongoose.models.SellerNotification || mongoose.model("SellerNotification", sellerNotificationSchema);
