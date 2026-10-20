import mongoose from "mongoose";

const sellerListingPaymentSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, unique: true, sparse: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 300 },
    status: { type: String, enum: ["pending", "processing", "used"], default: "pending" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
}, { timestamps: true });

const SellerListingPayment = mongoose.models.SellerListingPayment
    || mongoose.model("SellerListingPayment", sellerListingPaymentSchema);

export default SellerListingPayment;
